(() => {
  'use strict';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const blend = (from, to, progress) => from + (to - from) * progress;

  window.MobileChapter = class {
    constructor(pager, { isReduced, prepare, enter, cancelEntry }) {
      this.pager = pager;
      this.isReduced = isReduced;
      this.prepare = prepare;
      this.enter = enter;
      this.cancelEntry = cancelEntry;
      this.stage = document.querySelector('.scenes');
      this.control = this.stage.querySelector('.mobile-thread-control');
      this.rail = this.control.querySelector('.mobile-thread-rail');
      this.seek = this.stage.querySelector('.scene-about .music-seek');
      this.canvas = this.stage.querySelector('.mobile-thread-canvas');
      this.narrow = matchMedia('(max-width: 600px)');
      this.progress = 0;
      this.grip = 0;
      this.frame = 0;
      this.ignoreClickBefore = 0;

      this.control.addEventListener('pointerdown', event => this.down(event));
      this.control.addEventListener('pointermove', event => this.move(event));
      this.control.addEventListener('pointerup', event => this.up(event));
      for (const type of ['pointercancel', 'lostpointercapture']) {
        this.control.addEventListener(type, event => {
          if (this.pointer?.id === event.pointerId) this.cancel();
        });
      }
      this.control.addEventListener('click', event => this.click(event));
      this.narrow.addEventListener('change', () => this.cancel());
      for (const type of ['resize', 'blur', 'site:motion']) {
        window.addEventListener(type, () => this.cancel());
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.cancel();
      });
    }

    available() {
      return this.narrow.matches && !this.pager.blocked &&
        Math.abs(this.pager.position) < .01 && this.pager.target === 0;
    }

    down(event) {
      if (!event.isPrimary || event.button !== 0 || this.isReduced() || !this.available()) return;
      this.ignoreClickBefore = 0;
      this.pointer = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        lastY: event.clientY, stamp: event.timeStamp, speed: 0
      };
      this.control.setPointerCapture(event.pointerId);
    }

    move(event) {
      const pointer = this.pointer;
      if (pointer?.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = pointer.y - event.clientY;
      if (!this.layout) {
        if (Math.abs(dy) < 7 && Math.abs(dx) < 9) return;
        pointer.moved = true;
        if (Math.abs(dy) < Math.abs(dx) * .75 || !this.available() || !this.begin(pointer.x)) return;
      }
      const elapsed = Math.max(1, event.timeStamp - pointer.stamp);
      const speed = clamp((pointer.lastY - event.clientY) / elapsed, -2.5, 2.5);
      pointer.speed = blend(pointer.speed, speed, .55);
      pointer.lastY = event.clientY;
      pointer.stamp = event.timeStamp;
      this.grip = clamp(dx / 3, -37, 37);
      this.render(clamp(dy / this.layout.range));
    }

    up(event) {
      const pointer = this.pointer;
      if (pointer?.id !== event.pointerId) return;
      this.pointer = null;
      if (pointer.moved) this.ignoreClickBefore = performance.now() + 450;
      if (!this.layout) return;

      const speed = event.timeStamp - pointer.stamp < 95 ? pointer.speed : 0;
      const projected = this.progress + speed * 108 / this.layout.range;
      const advance = this.progress >= .49 || (this.progress >= .15 && projected >= .5);
      this.settle(advance, event.isTrusted);
    }

    click(event) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (this.layout || (event.detail > 0 && performance.now() < this.ignoreClickBefore)) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (!this.available()) return;
      event.preventDefault();
      event.stopPropagation();
      if (this.isReduced() || !this.begin()) {
        this.prepare(event.isTrusted);
        this.enter();
        return;
      }
      this.render(0);
      this.settle(true, event.isTrusted);
    }

    begin(grabX) {
      const source = this.rail.getBoundingClientRect();
      const bounds = this.stage.getBoundingClientRect();
      const ctx = this.canvas.getContext('2d');
      if (!ctx || !bounds.width || !bounds.height) return false;

      this.stage.dataset.mobileThread = '';
      this.pager.lock(true);
      const target = this.seek.getBoundingClientRect();
      const scale = Math.min(2, devicePixelRatio || 1);
      this.canvas.width = Math.round(bounds.width * scale);
      this.canvas.height = Math.round(bounds.height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      this.ctx = ctx;
      this.layout = {
        width: bounds.width,
        height: bounds.height,
        range: clamp(bounds.height * .52, 168, 330),
        grab: grabX === undefined ? .8 : clamp((grabX - source.left) / source.width, .05, .95),
        from: { left: source.left - bounds.left, width: source.width, y: source.top + source.height / 2 - bounds.top },
        to: { left: target.left - bounds.left, width: target.width, y: target.top + target.height / 2 - bounds.top }
      };
      this.grip = 0;
      return true;
    }

    render(progress) {
      this.progress = progress;
      const { from, to, width, height, grab, range } = this.layout;
      const style = this.stage.style;
      const bow = Math.sin(progress * Math.PI);
      const y = blend(from.y - range * progress, to.y, progress ** 3.7);
      const seam = y + (height - from.y) * (1 - progress) ** 3 - to.y * progress ** 3;
      const handoff = clamp((progress - .93) / .07);
      style.setProperty('--thread-progress', progress.toFixed(4));
      style.setProperty('--thread-home-y', (-progress * 115) + 'px');
      style.setProperty('--thread-home-opacity', String(1 - clamp(progress * 1.18)));
      style.setProperty('--thread-reveal', clamp(seam, 0, height) + 'px');
      style.setProperty('--thread-radius', (30 * (1 - progress)) + 'px');
      style.setProperty('--thread-seek-opacity', String(handoff));

      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);
      const left = blend(from.left, to.left, progress);
      const span = blend(from.width, to.width, progress);
      const contact = blend(.8, grab, clamp(progress * 7));
      const position = Number(this.seek.value) / Number(this.seek.max);
      const thumb = blend(contact, position, progress ** 2.1);
      const color = (warm, cool) => 'rgb(' + warm.map((channel, i) => Math.round(blend(channel, cool[i], progress))).join(',') + ')';
      const ink = color([189, 104, 77], [66, 106, 88]);
      const wave = t => {
        const distance = t - thumb;
        const tension = Math.exp(-15 * distance * distance);
        const edge = Math.sin(Math.PI * t);
        return y + bow * edge * (Math.sin(distance * 13) * 6 + tension * (-21 + this.grip * .4));
      };

      ctx.save();
      ctx.globalAlpha = 1 - handoff;
      ctx.beginPath();
      ctx.moveTo(left, wave(0));
      for (let i = 1; i <= 48; i++) {
        const t = i / 48;
        ctx.lineTo(left + t * span, wave(t));
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = ink;
      ctx.stroke();

      if (bow > .02) {
        ctx.save();
        ctx.globalAlpha *= bow * .55;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const t = i / 11;
          const x = left + t * span;
          const top = wave(t) + 6;
          ctx.moveTo(x, top);
          ctx.lineTo(x, top + (i % 3 === 0 ? 7 : 3));
        }
        ctx.stroke();
        ctx.restore();
      }

      const thumbX = left + blend(0, 6, progress) + thumb * (span - blend(0, 12, progress));
      const thumbY = wave(thumb);
      ctx.fillStyle = ink;
      ctx.globalAlpha = (1 - handoff) * blend(.13, .06, progress);
      ctx.beginPath();
      ctx.arc(thumbX, thumbY, 10 + bow * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1 - handoff;
      ctx.fillStyle = color([230, 107, 79], [66, 106, 88]);
      ctx.beginPath();
      ctx.arc(thumbX, thumbY, blend(6.5, 6, progress), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    settle(advance, trusted) {
      const from = this.progress;
      const to = Number(advance);
      const grip = this.grip;
      const duration = 160 + 340 * Math.abs(to - from);
      const began = performance.now();
      if (advance) {
        this.prepared = true;
        this.prepare(trusted);
      }
      const tick = now => {
        const fraction = clamp((now - began) / duration);
        const eased = 1 - (1 - fraction) ** 3;
        this.grip = blend(grip, 0, eased);
        this.render(blend(from, to, eased));
        if (fraction < 1) {
          this.frame = requestAnimationFrame(tick);
        } else {
          this.finish(advance);
        }
      };
      this.frame = requestAnimationFrame(tick);
    }

    finish(advance) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.layout = null;
      delete this.stage.dataset.mobileThread;
      for (const name of ['progress', 'home-y', 'home-opacity', 'reveal', 'radius', 'seek-opacity']) {
        this.stage.style.removeProperty('--thread-' + name);
      }
      this.pager.lock(false);
      if (!advance && this.prepared) this.cancelEntry();
      this.prepared = false;
      if (advance) this.enter();
    }

    cancel() {
      const pointer = this.pointer;
      this.pointer = null;
      if (pointer && this.control.hasPointerCapture(pointer.id)) this.control.releasePointerCapture(pointer.id);
      if (this.layout) {
        this.finish(false);
        return true;
      }
      return Boolean(pointer);
    }
  };
})();
