class SuperLazyLoads {
    constructor(e) {
        this.triggerEvents = e, this.eventOptions = { passive: !0 },
            this.userEventListener = this.triggerListener.bind(this),
            this.delayedScripts = { normal: [], async: [], defer: [] },
            this.allJQueries = []
    } _addUserInteractionListener(e) {
        this.triggerEvents.forEach((t => window.addEventListener(t, e.userEventListener, e.eventOptions)))
    } _removeUserInteractionListener(e) {
        this.triggerEvents.forEach((t => window.removeEventListener(t, e.userEventListener, e.eventOptions)))
    } triggerListener() {
        this._removeUserInteractionListener(this), "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", this._loadEverythingNow.bind(this)) : this._loadEverythingNow()
    } async _loadEverythingNow() {
        this._delayEventListeners(),
            this._delayJQueryReady(this),
            this._handleDocumentWrite(),
            this._registerAllDelayedScripts(),
            this._preloadAllScripts(),
            await this._loadScriptsFromList(this.delayedScripts.normal),
            await this._loadScriptsFromList(this.delayedScripts.defer),
            await this._loadScriptsFromList(this.delayedScripts.async),
            await this._triggerDOMContentLoaded(),
            await this._triggerWindowLoad(),
            window.dispatchEvent(new Event("rocket-allScriptsLoaded"))
    }
    _registerAllDelayedScripts() {
        document.querySelectorAll("script[type=SuperLazyLoad]").forEach((e => {
            e.hasAttribute("src") ? e.hasAttribute("async") && !1 !== e.async ? this.delayedScripts.async.push(e) : e.hasAttribute("defer") && !1 !== e.defer || "module" === e.getAttribute("data-rocket-type") ? this.delayedScripts.defer.push(e) : this.delayedScripts.normal.push(e) : this.delayedScripts.normal.push(e)
        }))
    } async _transformScript(e) {
        return await this._requestAnimFrame(),
            new Promise((t => {
                const n = document.createElement("script");
                let r;[...e.attributes].forEach((e => {
                    let t = e.nodeName; "type" !== t && ("data-rocket-type" === t && (t = "type", r = e.nodeValue), n.setAttribute(t, e.nodeValue))
                })),
                    e.hasAttribute("src") ? (n.addEventListener("load", t), n.addEventListener("error", t)) :
                        (n.text = e.text, t()), e.parentNode.replaceChild(n, e)
            }))
    } async _loadScriptsFromList(e) {
        const t = e.shift();
        return t ? (await this._transformScript(t), this._loadScriptsFromList(e)) : Promise.resolve()
    } _preloadAllScripts() {
        var e = document.createDocumentFragment();
        [...this.delayedScripts.normal, ...this.delayedScripts.defer, ...this.delayedScripts.async].forEach((t => {
            const n = t.getAttribute("src"); if (n) {
                const t = document.createElement("link"); t.href = n, t.rel = "preload", t.as = "script", e.appendChild(t)
            }
        })), document.head.appendChild(e)
    } _delayEventListeners() {
        let e = {};
        function t(t, n) {
            ! function (t) {
                function n(n) {
                    return e[t].eventsToRewrite.indexOf(n) >= 0 ? "rocket-" + n : n
                } e[t] || (e[t] = {
                    originalFunctions: {
                        add: t.addEventListener, remove: t.removeEventListener
                    }, eventsToRewrite: []
                }, t.addEventListener = function () {
                    arguments[0] = n(arguments[0]), e[t].originalFunctions.add.apply(t, arguments)
                },
                    t.removeEventListener = function () {
                        arguments[0] = n(arguments[0]), e[t].originalFunctions.remove.apply(t, arguments)
                    })
            }(t), e[t].eventsToRewrite.push(n)
        } function n(e, t) {
            let n = e[t]; Object.defineProperty(e, t, {
                get: () => n || function () { }, set(r) { e["rocket" + t] = n = r }
            })
        }
        t(document, "DOMContentLoaded"),
            t(window, "DOMContentLoaded"),
            t(window, "load"),
            t(window, "pageshow"),
            t(document, "readystatechange"),
            n(document, "onreadystatechange"),
            n(window, "onload"),
            n(window, "onpageshow")
    } _delayJQueryReady(e) {
        let t = window.jQuery;
        Object.defineProperty(window, "jQuery", {
            get: () => t, set(n) {
                if (n && n.fn && !e.allJQueries.includes(n)) {
                    n.fn.ready = n.fn.init.prototype.ready = function (t) {
                        e.domReadyFired ? t.bind(document)(n) : document.addEventListener("rocket-DOMContentLoaded", (() => t.bind(document)(n)))
                    };
                    const t = n.fn.on; n.fn.on = n.fn.init.prototype.on = function () {
                        if (this[0] === window) {
                            function e(e) {
                                return e.split(" ").map((e => "load" === e || 0 === e.indexOf("load.") ? "rocket-jquery-load" : e)).join(" ")
                            }
                            "string" == typeof arguments[0] || arguments[0] instanceof String ? arguments[0] = e(arguments[0]) : "object" == typeof arguments[0] && Object.keys(arguments[0]).forEach((t => {
                                delete Object.assign(arguments[0], { [e(t)]: arguments[0][t] })[t]
                            }))
                        }
                        return t.apply(this, arguments), this
                    }, e.allJQueries.push(n)
                } t = n
            }
        })
    }
    async _triggerDOMContentLoaded() {
        this.domReadyFired = !0,
            await this._requestAnimFrame(),
            document.dispatchEvent(new Event("rocket-DOMContentLoaded")),
            await this._requestAnimFrame(), window.dispatchEvent(new Event("rocket-DOMContentLoaded")),
            await this._requestAnimFrame(), document.dispatchEvent(new Event("rocket-readystatechange")),
            await this._requestAnimFrame(), document.rocketonreadystatechange && document.rocketonreadystatechange()
    }
    async _triggerWindowLoad() {
        await this._requestAnimFrame(),
            window.dispatchEvent(new Event("rocket-load")),
            await this._requestAnimFrame(),
            window.rocketonload && window.rocketonload(),
            await this._requestAnimFrame(),
            this.allJQueries.forEach((e => e(window).trigger("rocket-jquery-load"))),
            window.dispatchEvent(new Event("rocket-pageshow")),
            await this._requestAnimFrame(),
            window.rocketonpageshow && window.rocketonpageshow()
    } _handleDocumentWrite() {
        const e = new Map; document.write = document.writeln = function (t) {
            const n = document.currentScript,
                r = document.createRange(),
                i = n.parentElement;
            let o = e.get(n);
            void 0 === o && (o = n.nextSibling, e.set(n, o));
            const a = document.createDocumentFragment();
            r.setStart(a, 0), a.appendChild(r.createContextualFragment(t)), i.insertBefore(a, o)
        }
    } async _requestAnimFrame() { return new Promise((e => requestAnimationFrame(e))) } static run() {
        const e = new SuperLazyLoads(["keydown", "mousemove", "touchmove", "touchstart", "touchend", "wheel"]);
        e._addUserInteractionListener(e)
    }
}
SuperLazyLoads.run();
