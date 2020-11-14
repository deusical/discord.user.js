let i = document.createElement("iframe");
document.body.appendChild(i);
window.dtoken = i.contentWindow.localStorage.token

class Message {
    constructor(cid, id, content, author, member, mentions) {
        this.channel = new Channel(cid)
        this.content = content
        this.id = id;
        this.author = author
        this.author.member = member
        this.mentions = mentions
    }
    edit(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('PATCH', `/v8/channels/${this.channel.id}/messages/${this.id}`, cfg).then(r => {
                resolve(r)
            }).catch(e => {
                reject(e)
            })
        })
    }
    delete() {
        return new Promise((resolve, reject) => {
            selfbot.route('DELETE', `/v8/channels/${this.channel.id}/messages/${this.id}`).then(r => {
                resolve(r)
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class Channel {
    constructor(id) {
        this.id = id;
    }
    send(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('POST', `/v8/channels/${this.id}/messages`, cfg).then(r => {
                resolve(r)
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class selfbot {
    constructor() {
        this.events = {};
    }
    static route(method, url, body) {
        return new Promise((resolve, reject) => {
            fetch("https://discord.com/api"+url, {
                method: method,
                headers: {
                    "Authorization": window.dtoken.replaceAll('\"', ''),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }).then(res => res.text()).then(res => {
                try {
                    res = window._e_(res)
                } catch(e) {}
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        })
    }
    static Message = Message
    static Channel = Channel
    util = {
        sleep(s) {
            return new Promise(resolve => setTimeout(resolve, s*1000));
        },
        randint(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        randarr(arr) {
            return arr[Math.floor(Math.random() * arr.length)]
        },
        downloadString(text, fileType, fileName) {
            let blob = new Blob([text], { type: fileType });
            let a = document.createElement('a');
            a.download = fileName;
            a.href = URL.createObjectURL(blob);
            a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
        },
        queryReactClass: (cls, parent) => (parent || document).querySelector(`[class*="${cls}-"]`),
        queryReactClassAll: (cls, parent) => (parent || document).querySelectorAll(`[class*="${cls}-"]`),
        getGid: () => location.href.replace('https://discord.com', '').replace('http://discord.com', '').split('/')[2],
        getCid: () => location.href.replace('https://discord.com', '').replace('http://discord.com', '').split('/')[3],
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
    run() {
        window._e_ = JSON.parse
        window.JSON.parse = new Proxy(JSON.parse, {
            apply: (target, that, args) => {
                let data = window._e_(...args)
                let msg = data.d
                if (!data.t) return target(...args)
                switch (data.t) {
                    case 'MESSAGE_CREATE':
                        this.emit('message', new selfbot.Message(msg.channel_id, msg.id, msg.content, msg.author, msg.member, msg.mentions))
                        break
                    case 'READY':
                        this.user = data.d.user
                        this.data = data.d
                        this.emit('ready', data.d)
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