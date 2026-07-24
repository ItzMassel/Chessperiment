import * as Blockly from 'blockly';
import { BLOCK_HEIGHT, DEFAULT_WIDTH, registerSharedBlockly } from '@/components/editor/blockly/sharedBlocklyDefinitions';

registerSharedBlockly();

export const defineSquareBlocks = () => {
    Blockly.Blocks['on-step'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("onStep")
                .appendField(new Blockly.FieldDropdown([["Any", "Any"], ["Pawn", "Pawn"], ["Knight", "Knight"], ["Bishop", "Bishop"], ["Rook", "Rook"], ["Queen", "Queen"], ["King", "King"]]), "pieceType")
                .appendField("Color")
                .appendField(new Blockly.FieldDropdown([["Any", "Any"], ["White", "White"], ["Black", "Black"]]), "pieceColor");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when a piece lands on this square.");
        }
    };

    Blockly.Blocks['on-proximity'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("onProximity")
                .appendField(new Blockly.FieldNumber(1), "distance");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks');
            this.setTooltip("Fires when a piece is near this square.");
        }
    };

    Blockly.Blocks['teleport'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("teleport to")
                .appendField(new Blockly.FieldTextInput("a1"), "targetSquare");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#4169E1");
            this.setTooltip("Teleport the piece to another square.");
        }
    };

    Blockly.Blocks['disable-square'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("disableSquare");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#FF4500");
            this.setTooltip("Make this square inactive.");
        }
    };

    Blockly.Blocks['enable-square'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("enableSquare");
            this.setPreviousStatement(true, "Effect");
            this.setNextStatement(true, "Effect");
            this.setColour("#32CD32");
            this.setTooltip("Make this square active.");
        }
    };

    Blockly.Blocks['kill'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("kill");
            this.setPreviousStatement(true, "Effect");
            this.setColour("#9370DB");
            this.setTooltip("Remove the piece from the board.");
        }
    };

    Blockly.Blocks['win'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("win")
                .appendField(new Blockly.FieldDropdown([["Trigger Side", "Trigger Side"], ["White", "White"], ["Black", "Black"]]), "side");
            this.setPreviousStatement(true, "Effect");
            this.setColour("#9370DB");
            this.setTooltip("Declare a win for a specific side.");
        }
    };
};

defineSquareBlocks();