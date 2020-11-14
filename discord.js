let i = document.createElement("iframe");
document.body.appendChild(i);
window.dtoken = i.contentWindow.localStorage.token

class selfbot {
    constructor() {
        this.events = {};
    }
    on(event, listener) {
        if (typeof this.events[event] !== 'object') {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return () => this.removeListener(event, listener);
    }
    removeListener(event, listener) {
        if (typeof this.events[event] === 'object') {
            const idx = this.events[event].indexOf(listener);
            if (idx > -1) {
                this.events[event].splice(idx, 1);
            }
        }
    }
    emit(event, ...args) {
        if (typeof this.events[event] === 'object') {
            this.events[event].forEach(listener => listener.apply(this, args));
        }
    }
    once(event, listener) {
        const remove = this.on(event, (...args) => {
            remove();
            listener.apply(this, args);
        });
    }
    sendMsg(cid, cfg) {
        fetch(`https://discord.com/api/v8/channels/${cid}/messages`, {
            method: 'post',
            headers: {
                "Authorization": window.dtoken,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cfg)
        })
    }
    run() {
        window._e_ = JSON.parse
        window.JSON.parse = new Proxy(JSON.parse, {
            apply: (target, that, args) => {
                let data = window._e_(...args)
                if (!data.t) return target(...args)
                switch (data.t) {
                    case 'MESSAGE_CREATE':
                        this.emit('message', data.d)
                        break
                    default:
                        this.emit(data.t.toLowerCase(), data.d)
                        break
                }
                return target(...args)
            }
        });
    }
}
