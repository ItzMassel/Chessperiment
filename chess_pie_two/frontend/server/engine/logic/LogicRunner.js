const { toCoords } = require("../utils");
const { EffectFactory } = require("../effects");

class LogicRunner {
  // Prevent infinite recursion
  static pendingTriggers = [];
  static isExecuting = false;
  static MAX_ITERATIONS = 20;

  // Effect executor for enqueueing effects
  static effectExecutor = null;

  static setEffectExecutor(executor) {
    this.effectExecutor = executor;
  }

  static execute(piece, triggerType, context, board, effectExecutor) {
    if (!piece.logic || !Array.isArray(piece.logic)) return;

    // Use provided executor or stored one
    if (effectExecutor) {
      this.effectExecutor = effectExecutor;
    }

    // Queue trigger if already executing
    if (this.isExecuting) {
      this.pendingTriggers.push({
        pieceId: piece.id,
        type: triggerType,
        context,
      });
      return;
    }

    this.isExecuting = true;
    this.executeInternal(piece, triggerType, context, board);

    // Process queue
    let iterations = 0;
    while (
      this.pendingTriggers.length > 0 &&
      iterations < this.MAX_ITERATIONS
    ) {
      const pending = this.pendingTriggers.shift();
      // Fetch piece again in case it changed/moved
      const currentPiece = board.getPiece(
        pending.context.square || piece.position,
      );

      const targetPiece =
        currentPiece?.id === pending.pieceId ? currentPiece : piece;

      if (targetPiece && targetPiece.isCustom) {
        this.executeInternal(targetPiece, pending.type, pending.context, board);
      }
      iterations++;
    }

    if (this.pendingTriggers.length > 0) {
      console.warn(
        "[LogicRunner] Infinite loop risk loop detected. Clearing queue.",
      );
      this.pendingTriggers = [];
    }

    this.isExecuting = false;
  }

  static executeInternal(piece, triggerType, context, board) {
    // Fallback for renamed triggers
    let targetType = triggerType;
    if (triggerType === "on-is-captured") {
      const triggers = piece.logic.filter(
        (b) =>
          b.type === "trigger" &&
          (b.id === "on-is-captured" ||
            b.id === "on-capture" ||
            b.id === "on-captured"),
      );
      for (const trigger of triggers) {
        if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
          if (trigger.childId) {
            this.runBlock(piece, trigger.childId, context, board);
          }
        }
      }
      return;
    }

    const triggers = piece.logic.filter(
      (b) => b.type === "trigger" && b.id === targetType,
    );

    for (const trigger of triggers) {
      if (this.evaluateTriggerCondition(piece, trigger, context, board)) {
        if (trigger.childId) {
          this.runBlock(piece, trigger.childId, context, board);
        }
      }
    }
  }

  static evaluateTriggerCondition(piece, trigger, context, board) {
    const vals = this.resolveSocketValues(piece, trigger.socketValues);

    // Helper for piece matching
    const matchesType = (p, expected) => {
      if (!expected || expected === "Any") return true;
      if (!p) return false;
      const pType = p.type.toLowerCase();
      const pName = p.name ? p.name.toLowerCase() : "";
      const exp = expected.toLowerCase();
      return (
        pType === exp ||
        pType.startsWith(exp + "_") ||
        pName === exp ||
        pName.startsWith(exp + "_")
      );
    };

    switch (trigger.id) {
      case "on-is-captured":
      case "on-capture":
      case "on-captured":
        if (context.attacker && context.attacker.id !== piece.id) {
          return matchesType(context.attacker, vals.by);
        }
        if (context.capturedPiece && context.capturedPiece.id !== piece.id) {
          return matchesType(context.capturedPiece, vals.by);
        }
        return false;

      case "on-threat":
        return matchesType(context.attacker, vals.by);

      case "on-move":
        return true;

      case "on-environment":
        const [col, row] = toCoords(piece.position);
        const isWhiteSquare = (col + row) % 2 === 0;

        if (vals.condition === "White Square") return isWhiteSquare;
        if (vals.condition === "Black Square") return !isWhiteSquare;
        if (vals.condition === "Is Attacked")
          return context.isAttacked || false;

        if (context.squareTags && vals.tag) {
          return context.squareTags.includes(vals.tag);
        }

        return true;

      case "on-var":
        if (vals.varName) {
          const current = piece.variables[vals.varName] || 0;
          const isNumber =
            !isNaN(Number(vals.value)) && !isNaN(Number(current));

          if (isNumber) {
            const v = Number(vals.value);
            const c = Number(current);
            switch (vals.op) {
              case "==":
                return c === v;
              case "!=":
                return c !== v;
              case ">":
                return c > v;
              case "<":
                return c < v;
              case ">=":
                return c >= v;
              case "<=":
                return c <= v;
            }
          } else {
            const v = String(vals.value);
            const c = String(current);
            switch (vals.op) {
              case "==":
                return c === v;
              case "!=":
                return c !== v;
              default:
                return false;
            }
          }
        }
        return false;

      default:
        return true;
    }
  }

  static runBlock(piece, blockId, context, board) {
    const block = piece.logic.find((b) => b.instanceId === blockId);
    if (!block) return;

    const vals = this.resolveSocketValues(piece, block.socketValues);

    switch (block.id) {
      case "kill":
        const isAttackerTarget = vals.target === "Attacker";
        const targetPiece = isAttackerTarget ? context.attacker : piece;

        if (targetPiece && this.effectExecutor) {
          const tPos = targetPiece.position;
          this.effectExecutor.enqueue(EffectFactory.remove(tPos, "on-move"));

          if (
            targetPiece.id === piece.id ||
            (context.attacker && targetPiece.id === context.attacker.id)
          ) {
            context.movePrevented = true;
          }
        }
        break;

      case "transformation":
        if (vals.target && this.effectExecutor) {
          this.effectExecutor.enqueue(
            EffectFactory.transform(
              piece.position,
              vals.target,
              "on-move",
              piece.color,
            ),
          );
        }
        break;

      case "modify-var":
        if (vals.varName && vals.op && vals.value !== undefined) {
          const current = piece.variables[vals.varName] || 0;
          const val = Number(vals.value);
          if (!isNaN(val)) {
            let next = Number(current);
            if (vals.op === "+=") next += val;
            else if (vals.op === "-=") next -= val;
            else if (vals.op === "=") next = val;
            piece.variables[vals.varName] = next;
            this.execute(piece, "on-var", {}, board);
          } else if (vals.op === "=") {
            piece.variables[vals.varName] = vals.value;
            this.execute(piece, "on-var", {}, board);
          }
        }
        break;

      case "cooldown":
        if (vals.duration) {
          const d = Number(vals.duration);
          if (d > 0) piece.variables["cooldown"] = d;
        }
        break;

      case "explode":
        if (vals.radius !== undefined && this.effectExecutor) {
          this.effectExecutor.enqueue(
            EffectFactory.explode(
              piece.position,
              Number(vals.radius),
              "on-move",
            ),
          );
        }
        break;

      case "prevent":
        if (this.effectExecutor) {
          this.effectExecutor.enqueue(EffectFactory.cancelMove("pre-move"));
        }
        context.prevented = true;
        context.movePrevented = true;
        context.capturePrevented = true;
        break;

      case "win":
        if (this.effectExecutor) {
          this.effectExecutor.enqueue(
            EffectFactory.win(piece.color, "post-move"),
          );
        }
        context.gameWon = true;
        context.winner = piece.color;
        break;
    }

    if (block.childId) {
      this.runBlock(piece, block.childId, context, board);
    }
  }

  static resolveSocketValues(piece, socketValues) {
    const resolved = {};
    if (!socketValues) return resolved;

    for (const [key, val] of Object.entries(socketValues)) {
      if (val && typeof val === "object" && val.type === "variable") {
        const varName = val.name;
        if (val.variableOnly || key === "varName") {
          resolved[key] = varName;
        } else {
          resolved[key] =
            piece.variables[varName] !== undefined
              ? piece.variables[varName]
              : 0;
        }
      } else {
        resolved[key] = val;
      }
    }
    return resolved;
  }
}

module.exports = { LogicRunner };
