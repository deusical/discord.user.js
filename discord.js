let cache = {
    guilds: {},
    channels: {},
    messages: {},
    roles: {},
    members: {},
    users: {}
}

class User {
    constructor(data) {
        this.name = data.username
        this.discriminator = data.discriminator
        this.tag = `${data.username}#${data.discriminator}`
        this.flags = data.flags
        this.id = data.id
        this.avatar = data.avatar
        cache.users[data.id] = this
    }
    friend() {
        return new Promise((resolve, reject) => {
            selfbot.route('PUT', `/users/@me/relationships/${this.id}`, {}).then(r => {
                resolve(new User(r))
            }).catch(e => {
                reject(e)
            })
        })
    }
    unfriend() {
        return new Promise((resolve, reject) => {
            selfbot.route('DELETE', `/users/@me/relationships/${this.id}`).then(r => {
                resolve()
            }).catch(e => {
                reject(e)
            })
        })
    }
    block() {
        return new Promise((resolve, reject) => {
            selfbot.route('PUT', `/users/@me/relationships/${this.id}`, {type: 2}).then(r => {
                resolve()
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class Member extends User {
    constructor(gid, data) {
        super(data)
        this.guildid = gid
        this.roles = data.roles
        this.mute = data.mute
        this.joined_at = data.joined_at
        this.hoisted_role = data.hoisted_role
        this.deaf = data.deaf
        cache.members[data.id] = this
    }
    ban(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('PUT', `/guilds/${this.guildid}/bans/${this.id}`, cfg).then(r => {
                resolve()
            }).catch(e => {
                reject(e)
            })
        })
    }
    kick(reason) {
        return new Promise((resolve, reject) => {
            selfbot.route('DELETE', `/guilds/${this.guildid}/members/${this.id}?reason=${reason ? reason : ""}`).then(r => {
                resolve()
            }).catch(e => {
                reject(e)
            })
        })
    }
    edit(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('PATCH', `/guilds/${this.guildid}/members/${this.id}`, cfg).then(r => {
                resolve()
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class Message {
    constructor(msg) {
        this.guild = cache.guilds[msg.guild_id] ? cache.guilds[msg.guild_id] : new Guild(msg.guild_id)
        this.channel = cache.channels[msg.channel_id] ? cache.channels[msg.channel_id] : new TextChannel(msg.channel_id)
        this.content = msg.content
        this.id = msg.id;
        this.author = new User(msg.author)
        if (msg.member) {
            let m = msg.author
            for (let k of Object.keys(msg.member)) {
                m[k] = msg.member[k]
            }
            this.author.member = new Member(msg.guild_id, m)
        }
        this.mentions = msg.mentions
        this.mentions.roles = msg.mention_roles
        this.attachments = msg.attachments
        this.embeds = msg.embeds
        cache.messages[msg.id] = this
    }
    edit(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('PATCH', `/channels/${this.channel.id}/messages/${this.id}`, cfg).then(r => {
                resolve(r)
            }).catch(e => {
                reject(e)
            })
        })
    }
    delete() {
        return new Promise((resolve, reject) => {
            selfbot.route('DELETE', `/channels/${this.channel.id}/messages/${this.id}`).then(async r => {
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
        selfbot.route('GET',  `/channels/${id}`).then(r=>{
            for (let k of Object.keys(r)) {
                this[k] = r[k]
            }
        })
        cache.channels[id] = this
    }
    send(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('POST', `/channels/${this.id}/messages`, cfg).then(r => {
                resolve(r)
            }).catch(e => {
                reject(e)
            })
        })
    }
    edit(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('PATCH', `/channels/${this.id}`, cfg).then(r => {
                resolve(new TextChannel(r.id))
            }).catch(e => {
                reject(e)
            })
        })
    }
    delete() {
        return new Promise((resolve, reject) => {
            selfbot.route('DELETE', `/channels/${this.id}`).then(r => {
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
        selfbot.route('GET',  `/channels/${id}`).then(r=>{
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
        selfbot.route('GET',  `/guilds/${id}`).then(r=>{
            this.afk_channel = r.afk_channel_id ? new VoiceChannel(r.afk_channel_id) : null
            this.afk_timeout = r.afk_timeout
            this.application_id = r.application_id
            this.banner = r.banner
            this.default_notifs = r.default_message_notifications
            this.description = r.description
            this.discovery_splash = r.discovery_splash
            this.emojis = r.emojis
            this.content_filter = r.explicit_content_filter
            this.features = r.features
            this.icon = r.icon
            this.id = r.id
            this.max_members = r.max_members
            this.max_presences = r.max_presences
            this.max_video_channel_users = r.max_video_channel_users
            this.mfa_level = r.mfa_level
            this.name = r.name
            this.owner = r.owner_id ? new Member(r.owner_id) : null
            this.locale = r.preferred_locale
            this.boosts = r.premium_subscription_count
            this.boost_tier = r.premium_tier
            this.updates_channel = r.public_updates_channel_id ? new TextChannel(r.public_updates_channel_id) : null
            this.region = r.region
            this.roles = r.roles.map(role => new Role(role.id))
            this.rules = r.rules_channel_id ? new TextChannel(rules_channel_id) : null
            this.spash = r.splash
            this.system_channel_flags = r.system_channel_flags
            this.system_chanel = r.system_channel_id ? new TextChannel(r.system_channel_id) : null
            this.vanity_url = r.vanity_url_code
            this.verification_level = r.verification_level
            this.widget_channel = r.widget_channel_id ? new TextChannel(r.widget_channel_id) : null
            this.widgent_enabled = r.widgent_enabled
            for (let i = 0;i<this.roles.length;i++) {
                let nPog = this.roles[i]
                nPog.guildid = this.id
                this.roles[i] = new Role(nPog)
            }
        })
        cache.guilds[id] = this
    }
    createChannel(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('POST', `/guilds/${this.id}/channels`, cfg).then(r => {
                resolve(cfg.type == 0 ? new TextChannel(r.id) : (cfg.type == 2 ? new VoiceChannel(r.id) : new TextChannel(r.id)))
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class Role {
    constructor(data) {
        this.guildid = data.guildid
        this.position = data.position
        this.permissions = data.permissions
        this.name = data.name
        this.mentionable = data.mentionable
        this.managed = data.managed
        this.id = data.id
        this.hoist = data.hoist
        this.color = data.color
        cache.roles[data.id] = this
    }
    edit(cfg) {
        return new Promise((resolve, reject) => {
            selfbot.route('PATCH', `/guilds/${this.guildid}/roles/${this.id}`, cfg).then(r => {
                r.guildid = this.guildid
                resolve(new Role(r))
            }).catch(e => {
                reject(e)
            })
        })
    }
    delete() {
        return new Promise((resolve, reject) => {
            selfbot.route('DELETE', `/guilds/${this.guildid}/roles/${this.id}`, cfg).then(r => {
                r.guildid = this.guildid
                resolve(new Role(r))
            }).catch(e => {
                reject(e)
            })
        })
    }
}

class selfbot {
    constructor() {
        this.events = {};
        this.read = false
        this.init()
    }
    init() {
        selfbot.util.waitUntil(() => window.webpackJsonp).then(() => {
            let key;
            var req = webpackJsonp.push([[], { extra_id: (e, t, r) => e.exports = r }, [["extra_id"]]]); for (let e in req.c)
                if (req.c.hasOwnProperty(e)) {
                    let t = req.c[e].exports; if (t && t.__esModule && t.default)
                        for (let e in t.default) "getToken" === e && (key = t.default.getToken())
                }
            this.token = key
            this.ready = true
            window.token = this.token
            window.ready = true
            this.emit('ready')
        })
    }
    static route(method, url, body) {
        return new Promise((resolve, reject) => {
            fetch("https://discord.com/api/v9"+url, {
                method: method,
                headers: {
                    "Authorization": window.token,
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
                            "Authorization": window.token,
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
    static Role = Role
    static User = User
    static Member = Member
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
        waitUntil(f) {
            return new Promise(resolve => {
                setInterval(() => {
                    try {
                        if (f()) {
                            resolve();
                        }
                    } catch { }
                }, 100);
            });
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
                if (!data.t || !window.ready) return target(...args)
                switch (data.t) {
                    case 'MESSAGE_CREATE':
                        if (!msg.author) {
                            console.log('No author.', msg)
                            return target(...args)
                        }
                        this.emit('message', new selfbot.Message(msg))
                        break
                    case 'MESSAGE_UPDATE':
                        if (cache.messages[msg.id]) {
                            let old = cache.messages[msg.id]
                            for (let k of Object.keys(msg)) {
                                cache.messages[msg.id][k] = msg[k]
                            }
                            this.emit('message_update', old, cache.messages[msg.id])
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
                            this.emit('guild_update', old, cache.guilds[msg.id])
                        } else {
                            this.emit('guild_update', null, new selfbot.Guild(msg.id))
                        }
                        break
                    case 'GUILD_DELETE':
                        if (cache.guilds[msg.id]) {
                            this.emit('guild_delete', cache.guilds[msg.id])
                        } else {
                            this.emit('guild_delete', msg)
                        }
                        break
                    case 'GUILD_ROLE_CREATE':
                        msg.role.guildid = msg.guild_id
                        this.emit('guild_role_create', new selfbot.Role(msg.role))
                        break
                    case 'GUILD_ROLE_UPDATE':
                        if (msg.role) {
                            if (cache.roles[msg.role.id]) {
                                let old = cache.roles[msg.role.id]
                                for (let k of Object.keys(msg.role)) {
                                    cache.roles[msg.role.id][k] = msg.role[k]
                                }
                                this.emit('guild_role_update', old, cache.roles[msg.role.id])
                            } else {
                                this.emit('guild_role_update', null, new selfbot.Role(msg.role))
                            }
                        }
                        break
                    case 'GUILD_ROLE_DELETE':
                        if (cache.roles[msg.role_id]) {
                            this.emit('guild_role_delete', cache.roles[msg.role_id])
                        } else {
                            this.emit('guild_role_delete', msg)
                        }
                        break
                    case 'CHANNEL_CREATE':
                        this.emit('gulid_channel_create', msg.type == 0 ? new TextChannel(msg.id) : (msg.type == 2 ? new VoiceChannel(msg.id) : null))
                        break
                    case 'CHANNEL_UPDATE':
                        if (cache.channels[msg.id]) {
                            let old = cache.channels[msg.id]
                            for (let k of Object.keys(msg)) {
                                cache.channels[msg.id][k] = msg[k]
                            }
                            this.emit('guild_channel_update', old, cache.channels[msg.id])
                        }
                        break
                    case 'CHANNEL_DELETE':
                        if (cache.channels[msg.id]) {
                            this.emit('guild_channel_delete', cache.channels[msg.id])
                        } else {
                            this.emit('guild_channel_delete', msg)
                        }
                        break
                    case 'GUILD_BAN_ADD':
                        if (cache.users[msg.user.id]) {
                            this.emit('guild_ban_add', msg.guild_id, cache.users[msg.user.id])
                        } else {
                            this.emit('guild_ban_add', msg.guild_id, new selfbot.User(msg.user))
                        }
                        break
                    case 'GUILD_BAN_REMOVE':
                        if (cache.users[msg.user.id]) {
                            this.emit('guild_ban_remove', msg.guild_id, cache.useres[msg.user.id])
                        } else {
                            this.emit('guild_ban_remove', msg.guild_id, new selfbot.User(msg.user))
                        }
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