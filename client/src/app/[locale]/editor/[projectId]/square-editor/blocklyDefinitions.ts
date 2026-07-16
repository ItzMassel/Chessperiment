import * as Blockly from 'blockly';

// Shared constants to match PageClient.tsx
export const BLOCK_HEIGHT = 48;
export const DEFAULT_WIDTH = 220;
export const VARIABLE_WIDTH = 160;
export const CONNECTOR_X = 24;
export const CONNECTOR_Y = BLOCK_HEIGHT + 4;

/**
 * Defines the custom block types for the Logic Editor.
 */
export const defineCustomBlocks = () => {
    // Triggers (Yellow)
    Blockly.Blocks['on-step'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("onStep")
                .appendField(new Blockly.FieldDropdown([["Any", "Any"], ["Pawn", "Pawn"], ["Knight", "Knight"], ["Bishop", "Bishop"], ["Rook", "Rook"], ["Queen", "Queen"], ["King", "King"]]), "pieceType")
                .appendField("Color")
                .appendField(new Blockly.FieldDropdown([["Any", "Any"], ["White", "White"], ["Black", "Black"]]), "pieceColor");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks'); // Use style for black text
            this.setTooltip("Fires when a piece lands on this square.");
        }
    };

    Blockly.Blocks['on-proximity'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("onProximity")
                .appendField(new Blockly.FieldNumber(1), "distance");
            this.setNextStatement(true, "Effect");
            this.setStyle('trigger_blocks'); // Use style for black text
            this.setTooltip("Fires when a piece is near this square.");
        }
    };

    // Effects (Blue)
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

    // Terminals (Purple)
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

/**
 * Custom Constant Provider to define LEGO-style shapes with pill-like roundness.
 */
class CustomConstantProvider extends Blockly.blockRendering.ConstantProvider {
    constructor() {
        super();
        this.NOTCH_WIDTH = 12;
        this.NOTCH_HEIGHT = 4;
        this.CORNER_RADIUS = 12; // Softer, more modern corners
        this.TAB_WIDTH = 12;
        this.TAB_HEIGHT = 4;
        
        // Tightened padding to fix "too tall" blocks
        this.EMPTY_BLOCK_SPACER_HEIGHT = 8;
        this.TOP_ROW_MIN_HEIGHT = 18; 
        this.BOTTOM_ROW_MIN_HEIGHT = 4;
        this.NOTCH_OFFSET_LEFT = 24;
        
        // Ensure text and fields are centered
        this.FIELD_TEXT_BASELINE_CENTER = true;
    }

    // Override to ensure all corners are rounded, fixing the "cut off" right side
    protected override makeOutsideCorners(): any {
        const radius = this.CORNER_RADIUS;
        return {
            topLeft: `a ${radius},${radius} 0 0,1 ${radius},-${radius}`,
            topRight: `a ${radius},${radius} 0 0,1 ${radius},${radius}`,
            bottomRight: `a ${radius},${radius} 0 0,1 -${radius},${radius}`,
            bottomLeft: `a ${radius},${radius} 0 0,1 -${radius},-${radius}`
        };
    }

    protected override makeNotch(): any {
        const width = this.NOTCH_WIDTH;
        const height = this.NOTCH_HEIGHT;
        return {
            type: 1,
            width: width,
            height: height,
            pathLeft: `l 3,${height} ${width - 6},0 3,-${height}`,
            pathRight: `l -3,${height} -${width - 6},0 -3,-${height}`
        };
    }

    protected override makePuzzleTab(): any {
        const width = this.TAB_WIDTH;
        const height = this.TAB_HEIGHT;
        return {
            type: 2,
            width: width,
            height: height,
            pathLeft: `l 0,3 ${width},0 0,-3`,
            pathRight: `l 0,3 -${width},0 0,-3`,
            pathDown: `l 3,0 ${width - 6},${height} 3,-${height}`,
            pathUp: `l 3,0 ${width - 6},-${height} 3,${height}`
        };
    }
}

/**
 * Custom Renderer.
 */
export class CustomRenderer extends Blockly.blockRendering.Renderer {
    protected override makeConstants_(): Blockly.blockRendering.ConstantProvider {
        return new CustomConstantProvider();
    }
}

// Run registration immediately
defineCustomBlocks();

// Register items
if (typeof window !== 'undefined') {
    // Register Renderer
    if (!Blockly.registry.hasItem(Blockly.registry.Type.RENDERER, 'custom_renderer')) {
        Blockly.registry.register(Blockly.registry.Type.RENDERER, 'custom_renderer', CustomRenderer);
    }

    // Register a proper Dark Theme to avoid registry errors
    const DarkTheme = Blockly.Theme.defineTheme('custom_dark', {
        'name': 'custom_dark',
        'base': Blockly.Themes.Classic,
        'blockStyles': {
            'trigger_blocks': {
                'colourPrimary': '#FFD700',
                'colourSecondary': '#FFEC8B',
                'colourTertiary': '#CDBE70'
            }
        },
        'componentStyles': {
            'workspaceBackgroundColour': '#0c0e12',
            'toolboxBackgroundColour': '#1a1d23',
            'flyoutBackgroundColour': '#1a1d23',
            'scrollbarColour': '#ffffff10',
            'scrollbarOpacity': 0.1,
        }
    });

    if (!Blockly.registry.hasItem(Blockly.registry.Type.THEME, 'custom_dark')) {
        Blockly.registry.register(Blockly.registry.Type.THEME, 'custom_dark', DarkTheme);
    }
}
