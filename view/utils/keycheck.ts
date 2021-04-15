import KeyMap from './keymap';

export default class KeyCheck {
    private CTRL_MASK = 0x1000;
    private ALT_MASK = 0x2000;
    private SHIFT_MASK = 0x4000;
    public hash(unknown: any) {
        if (typeof unknown === 'string') {
            return this.hashKeyExpression(unknown);
        }
        return this.hashKeyEvent(unknown);
    }
    public is(a: any, b: any) {
        return a && b && this.hash(a) == this.hash(b);
    }

    private hashKeyEvent(keyEvent: any) {
        var hashCode = 0;
        if (keyEvent.ctrlKey || keyEvent.metaKey) {
            hashCode |= this.CTRL_MASK;
        }
        if (keyEvent.altKey) {
            hashCode |= this.ALT_MASK;
        }
        if (keyEvent.shiftKey) {
            hashCode |= this.SHIFT_MASK;
        }
        // Shift, Control, Alt KeyCode ignored.
        if ([16, 17, 18, 91].indexOf(keyEvent.keyCode) === -1) {
            /**
             * 解决浏览器输入法状态下对keyDown的keyCode判断不准确的问题,使用keyIdentifier,
             * 可以解决chrome和safari下的各种问题,其他浏览器依旧有问题,然而那并不影响我们对特
             * 需判断的按键进行判断(比如Space在safari输入法态下就是229,其他的就不是)
             * @editor Naixor
             * @Date 2015-12-2
             */
            if (keyEvent.keyCode === 229 && keyEvent.keyIdentifier) {
                return (hashCode |= parseInt(keyEvent.keyIdentifier.substr(2), 16));
            }
            hashCode |= keyEvent.keyCode;
        }
        return hashCode;
    }

    private hashKeyExpression(keyExpression: any) {
        const keys = new KeyMap();
        var hashCode = 0;
        keyExpression
            .toLowerCase()
            .split(/\s*\+\s*/)
            .forEach((name: string) => {
                switch (name) {
                    case 'ctrl':
                    case 'cmd':
                        hashCode |= this.CTRL_MASK;
                        break;
                    case 'alt':
                        hashCode |= this.ALT_MASK;
                        break;
                    case 'shift':
                        hashCode |= this.SHIFT_MASK;
                        break;
                    default:
                        hashCode |= keys.getKeyMap(name);
                }
            });
        return hashCode;
    }
}
