class injectedAjax {
  constructor(props = {}) {
    this.counter = 0;
    this.__backup = {};
    this.target =
      props.target || (window && window.XMLHttpRequest.prototype) || {};
    this.time = props.time || 1000;
    this.eventlists = [];
  }

  save(key, val) {
    this.__backup[key] = val;
  }

  // 重置计数，还原对象方法
  destroy() {
    this.counter = 0;
    const KEYS = Object.keys(this.__backup);
    if (KEYS.length === 0) return;

    KEYS.forEach(k => {
      this.target[k] = this.__backup[k];
    });
  }

  logger(c) {
    console.log("counter:", c);
  }

  // 监听counter被重置
  async listen() {
    let t;
    while (true) {
      if (t) clearTimeout(t);

      await new Promise(resolve => {
        t = setTimeout(() => {
          resolve();
        }, this.time);
      });

      if (this.counter === 0) {
        this.logger("all ajax request ended！");

        const length = this.eventlists.length;
        if (length < 0) return;

        for (let i = 0; i < length; i++) {
          this.eventlists[i]();
        }
      }
    }
  }

  // 重写方法
  inject() {
    if (!this.target) return;
    const send = this.target.send;
    const that = this;
    this.save("send", send);

    this.target.send = function() {
      this.addEventListener("loadstart", () => {
        that.counter++;
        this.logger(that.counter);
      });

      this.addEventListener("loadend", () => {
        that.counter--;
        this.logger(that.counter);
      });

      send.apply(this, arguments);

      this.listen();
    };

    return this;
  }

  // 注册监听事件
  after(e) {
    if (!e instanceof Function) return this;
    this.eventlists.push(e);
    return this;
  }
}

let ajax;

if (!ajax) {
  ajax = new injectedAjax();
}

export default ajax;

// export default (function(xhr) {
//   if (!xhr) return;
//   let __backup = {};
//   let counter = 0;
//   const send = xhr.send;
//   __backup["send"] = xhr.send;

//   function logger(c) {
//     console.log("counter:", c);
//   }

//   xhr.send = function() {
//     this.addEventListener("loadstart", () => {
//       counter++;
//       logger(counter);
//     });

//     this.addEventListener("loadend", () => {
//       counter--;
//       logger(counter);
//     });

//     send.apply(this, arguments);
//   };
// })(XMLHttpRequest.prototype);
