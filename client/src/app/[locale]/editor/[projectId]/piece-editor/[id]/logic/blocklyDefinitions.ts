import * as Blockly from 'blockly';
import { BLOCK_HEIGHT, DEFAULT_WIDTH, registerSharedBlockly } from '@/components/editor/blockly/sharedBlocklyDefinitions';

registerSharedBlockly();

export const definePieceBlocks = () => {
    // ─── Triggers (Yellow, bottom notch only) ───
    Blockly.Blocks['on-is-captured'] = {
        init: function () {
            this.appendDummyInput().appendField("onIsCaptured").appendField("by").appendField(new Blockly.FieldDropdown([["Any", "Any"], ["Pawn", "Pawn"], ["Knight", "Knight"], ["Bishop", "Bishop"], ["Rook", "Rook"], ["Queen", "Queen"], ["King", "King"]]), "by");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when this piece is captured by another piece.");
        }
    };

    Blockly.Blocks['on-captured'] = {
        init: function () {
            this.appendDummyInput().appendField("onCaptured").appendField("piece").appendField(new Blockly.FieldDropdown([["Any", "Any"], ["Pawn", "Pawn"], ["Knight", "Knight"], ["Bishop", "Bishop"], ["Rook", "Rook"], ["Queen", "Queen"], ["King", "King"]]), "piece");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when this piece captures another piece.");
        }
    };

    Blockly.Blocks['on-threat'] = {
        init: function () {
            this.appendDummyInput().appendField("onThreat").appendField("by").appendField(new Blockly.FieldDropdown([["Any", "Any"], ["Pawn", "Pawn"], ["Knight", "Knight"], ["Bishop", "Bishop"], ["Rook", "Rook"], ["Queen", "Queen"], ["King", "King"]]), "by");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when this piece is threatened by another piece.");
        }
    };

    Blockly.Blocks['on-move'] = {
        init: function () {
            this.appendDummyInput().appendField("onMove");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when this piece moves.");
        }
    };

    Blockly.Blocks['on-environment'] = {
        init: function () {
            this.appendDummyInput().appendField("onEnvironment").appendField(new Blockly.FieldDropdown([["White Square", "White Square"], ["Black Square", "Black Square"], ["Is Attacked", "Is Attacked"]]), "condition");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when the piece is on a specific board condition.");
        }
    };

    Blockly.Blocks['on-var'] = {
        init: function () {
            this.appendDummyInput().appendField("onVar").appendField(new Blockly.FieldVariable("var"), "varName").appendField(new Blockly.FieldDropdown([["==", "=="], ["!=", "!="], [">", ">"], ["<", "<"], [">=", ">="], ["<=", "<="]]), "op").appendField(new Blockly.FieldNumber(0), "value");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when a variable condition is met.");
        }
    };

    // ─── Effects (Blue, top+bottom notch) ───
    Blockly.Blocks['cooldown'] = {
        init: function () {
            this.appendDummyInput().appendField("cooldown").appendField("for").appendField(new Blockly.FieldNumber(1), "duration").appendField(new Blockly.FieldDropdown([["seconds", "seconds"], ["half-moves", "half-moves"], ["full-moves", "full-moves"]]), "unit");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#4169E1");
            this.setTooltip("Prevents this trigger from firing again for a duration.");
        }
    };

    Blockly.Blocks['transformation'] = {
        init: function () {
            this.appendDummyInput().appendField("transformation").appendField("→").appendField(new Blockly.FieldDropdown([["Pawn", "Pawn"], ["Knight", "Knight"], ["Bishop", "Bishop"], ["Rook", "Rook"], ["Queen", "Queen"], ["King", "King"]]), "target");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#4169E1");
            this.setTooltip("Transform this piece into another type.");
        }
    };

    Blockly.Blocks['modify-var'] = {
        init: function () {
            this.appendDummyInput().appendField("modVar").appendField(new Blockly.FieldVariable("var"), "varName").appendField(new Blockly.FieldDropdown([["+=", "+="], ["-=", "-="], ["=", "="]]), "op").appendField(new Blockly.FieldNumber(0), "value");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#4169E1");
            this.setTooltip("Modify a custom variable's value.");
        }
    };

    // ─── Effect (Red/Orange, top+bottom notch) ───
    Blockly.Blocks['prevent'] = {
        init: function () {
            this.appendDummyInput().appendField("prevent").appendField("by").appendField(new Blockly.FieldDropdown([["Jump Back", "Jump Back"], ["Nearest Square", "Nearest Square"], ["Share Square", "Share Square"]]), "action");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#FF4500");
            this.setTooltip("Prevent the triggering action.");
        }
    };

    Blockly.Blocks['explode'] = {
        init: function () {
            this.appendDummyInput().appendField("explode").appendField("radius").appendField(new Blockly.FieldNumber(1), "radius");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#FF4500");
            this.setTooltip("Explode, affecting pieces in radius.");
        }
    };

    // ─── Effect (Teal, top+bottom notch) ───
    Blockly.Blocks['tell-user'] = {
        init: function () {
            this.appendDummyInput().appendField("tellUser").appendField("message").appendField(new Blockly.FieldTextInput(""), "message");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#20B2AA");
            this.setTooltip("Display a message to the user.");
        }
    };

    // ─── Effect (Gold, top+bottom notch) ───
    Blockly.Blocks['win'] = {
        init: function () {
            this.appendDummyInput().appendField("win");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#FFD700");
            this.setTooltip("Declare a win for this piece's side.");
        }
    };

    // ─── Terminal (Purple, top notch only) ───
    Blockly.Blocks['kill'] = {
        init: function () {
            this.appendDummyInput().appendField("kill").appendField("Target").appendField(new Blockly.FieldDropdown([["Selected Piece", "Selected Piece"], ["Attacker", "Attacker"]]), "target");
            this.setPreviousStatement(true, "Effect");
            this.setColour("#9370DB");
            this.setTooltip("Remove the target piece from the board.");
        }
    };

    // ─── Variable Reporter Blocks (Green, output/round) ───
    Blockly.Blocks['var-x'] = {
        init: function () {
            this.appendDummyInput().appendField("x");
            this.setOutput(true);
            this.setColour("#32CD32");
            this.setTooltip("The x-coordinate (column) of this piece's position.");
        }
    };

    Blockly.Blocks['var-y'] = {
        init: function () {
            this.appendDummyInput().appendField("y");
            this.setOutput(true);
            this.setColour("#32CD32");
            this.setTooltip("The y-coordinate (row) of this piece's position.");
        }
    };
};

definePieceBlocks();