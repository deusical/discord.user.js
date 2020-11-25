let i = document.createElement("iframe");
document.body.appendChild(i);
window.dtoken = i.contentWindow.localStorage.token.replaceAll('\"', '')

let cache = {
    guilds: {},
    channels: {},
    messages: {},
    roles: {},
    users: {}
}

class User {
    constructor(data) {
        
    }
}

class Member {

}

class Message {
    constructor(msg) {
        this.guild = cache.guilds[msg.guild_id] ? cache.guilds[msg.guild_id] : new Guild(msg.guild_id)
        this.channel = cache.channels[msg.channel_id] ? cache.channels[msg.channel_id] : new Channel(msg.channel_id)
        this.content = msg.content
        this.id = msg.id;
        this.author = msg.author
        this.author.member = msg.member
        this.mentions = msg.mentions
        this.mentions.roles = msg.mention_roles
        this.attachments = msg.attachments
        this.embeds = msg.embeds
        cache.messages[msg.id] = this
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
            selfbot.route('DELETE', `/v8/channels/${this.channel.id}/messages/${this.id}`).then(async r => {
                resolve(r)
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class TextChannel {
    constructor(id) {
        this.id = id;
        selfbot.route('GET',  `/v8/channels/${id}`).then(r=>{
            for (let k of Object.keys(r)) {
                this[k] = r[k]
            }
        })
        cache.channels[id] = this
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
    edit(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('PATCH', `/v8/channels/${this.id}`, cfg).then(r => {
                resolve(new TextChannel(r.id))
            }).catch(e => {
                reject(e)
            })
        })
    }
    delete() {
        return new Promise((resolve, reject) => {
            selfbot.route('DELETE', `/v8/channels/${this.id}`).then(r => {
                resolve(r)
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class VoiceChannel {
    constructor(id) {
        this.id = id;
        selfbot.route('GET',  `/v8/channels/${id}`).then(r=>{
            for (let k of Object.keys(r)) {
                this[k] = r[k]
            }
        })
        cache.channels[id] = this
    }
}

class Guild {
    constructor(id) {
        this.id = id;
        selfbot.route('GET',  `/v8/guilds/${id}`).then(r=>{
            for (let k of Object.keys(r)) {
                this[k] = r[k]
            }
            for (let i = 0;i<this.roles.length;i++) {
                this.roles[i] = new Role(this.roles[i])
            }
        })
        cache.guilds[id] = this
    }
    createChannel(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('POST', `/v8/guilds/${this.id}/channels`, cfg).then(r => {
                resolve(cfg.type == 0 ? new TextChannel(r.id) : (cfg.type == 2 ? new VoiceChannel(r.id) : null))
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class Role {
    constructor(data) {
        this.id = data.id;
        cache.roles[data.id] = this
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
                    "Authorization": window.dtoken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }).then(res => res.text()).then(async res => {
                try {
                    res = window._e_(res)
                } catch(e) {}
                if (res.retry_after) {
                    await selfbot.util.sleep(res.retry_after)
                    fetch("https://discord.com/api"+url, {
                        method: method,
                        headers: {
                            "Authorization": window.dtoken,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(body)
                    }).then(res => res.text()).then(async res => {
                        try {
                            res = window._e_(res)
                        } catch(e) {}
                        resolve(res)
                    }).catch(err => {
                        reject(err)
                    })
                } else {
                    resolve(res)
                }
            }).catch(err => {
                reject(err)
            })
        })
    }
    static Message = Message
    static TextChannel = TextChannel
    static VoiceChannel = VoiceChannel
    static Guild = Guild
    static util = {
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
                        this.emit('message', new selfbot.Message(msg))
                        break
                    case 'MESSAGE_UPDATE':
                        if (cache.messages[msg.id]) {
                            let old = cache.messages[msg.id]
                            for (let k of Object.keys(msg)) {
                                cache.messages[msg.id][k] = msg[k]
                            }
                            this.emit('message_update', old, cache.messages[msg.id][k])
                        } else {
                            this.emit('message_update', null, new selfbot.Message(msg))
                        }
                        break
                    case 'MESSAGE_DELETE':
                        if (cache.messages[msg.id]) {
                            this.emit('message_delete', cache.messages[msg.id])
                        } else {
                            this.emit('message_delete', msg)
                        }
                        break
                    case 'GUILD_CREATE':
                        this.emit('guild_create', new selfbot.Guild(msg.id))
                        break
                    case 'GUILD_UPDATE':
                        if (cache.guilds[msg.id]) {
                            let old = cache.guilds[msg.id]
                            for (let k of Object.keys(msg)) {
                                cache.guilds[msg.id][k] = msg[k]
                            }
                            this.emit('message_update', old, cache.guilds[msg.id][k])
                        } else {
                            this.emit('message_update', null, new selfbot.Guild(msg.id))
                        }
                        break
                    case 'GUILD_DELETE':
                        if (cache.guilds[msg.id]) {
                            this.emit('message_delete', cache.guilds[msg.id])
                        } else {
                            this.emit('message_delete', msg)
                        }
                        break
                    case 'GUILD_ROLE_CREATE':
                        break
                    case 'GUILD_ROLE_UPDATE':
                        break
                    case 'GUILD_ROLE_DELETE':
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