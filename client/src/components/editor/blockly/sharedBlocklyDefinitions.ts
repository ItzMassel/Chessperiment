import * as Blockly from 'blockly';

export const BLOCK_HEIGHT = 48;
export const DEFAULT_WIDTH = 220;
export const VARIABLE_WIDTH = 160;
export const CONNECTOR_X = 24;
export const CONNECTOR_Y = BLOCK_HEIGHT + 4;

class CustomConstantProvider extends Blockly.blockRendering.ConstantProvider {
    constructor() {
        super();
        this.NOTCH_WIDTH = 12;
        this.NOTCH_HEIGHT = 4;
        this.CORNER_RADIUS = 12;
        this.TAB_WIDTH = 12;
        this.TAB_HEIGHT = 4;

        this.EMPTY_BLOCK_SPACER_HEIGHT = 8;
        this.TOP_ROW_MIN_HEIGHT = 18;
        this.BOTTOM_ROW_MIN_HEIGHT = 4;
        this.NOTCH_OFFSET_LEFT = 24;

        this.FIELD_TEXT_BASELINE_CENTER = true;
    }

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

export class CustomRenderer extends Blockly.blockRendering.Renderer {
    protected override makeConstants_(): Blockly.blockRendering.ConstantProvider {
        return new CustomConstantProvider();
    }
}

export function registerSharedBlockly(): void {
    if (typeof window === 'undefined') return;

    if (!Blockly.registry.hasItem(Blockly.registry.Type.RENDERER, 'custom_renderer')) {
        Blockly.registry.register(Blockly.registry.Type.RENDERER, 'custom_renderer', CustomRenderer);
    }

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