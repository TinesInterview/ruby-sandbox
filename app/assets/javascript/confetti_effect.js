class ConfettiEffect {
    constructor(options = {}) {
      this.containerElement = null;
      this.targetElement = options.targetElement || null;
      this.amount = options.amount || 60;
      this.confettiColors = ["#8D75E6", "#FD975D", "#F486B8", "#5ABE89", "#F0A848"];
      this.particles = [];
      this.disposers = [];
      this.gravity = 0.1;
      this.completed = false;
      this.onCompleteCallback = options.onComplete || null;
    }
  
    createParticle(index, x, y, velocityXMultiplier, color) {
      const particle = {
        index,
        x,
        y,
        z: 0,
        color,
        weight: Math.random() - 0.4 + 0.75,
        velocity: {
          x: Math.random() * 8 * velocityXMultiplier,
          y: (Math.random() - 0.8) * 6,
          z: (Math.random() - 0.8) * 6,
          rotation: (Math.random() - 0.5) * 120,
        },
        rotation: {
          vector: [Math.random(), Math.random(), Math.random()],
          angle: Math.random() * 300,
        },
        life: 5 + Math.random() * 2,
        element: document.createElement("b"),
        get hasCompleted() {
          return particle.life <= 0;
        },
        update: () => {
          if (particle.life <= 0) return;
          particle.x += particle.velocity.x;
          particle.y += particle.velocity.y;
          particle.z += particle.velocity.z;
          particle.rotation.angle += particle.velocity.rotation;
          particle.element.style.setProperty(
            "transform",
            `translate3d(${particle.x}px, ${particle.y}px, ${particle.z}px) rotate3d(${particle.rotation.vector.join(",")},${particle.rotation.angle}deg)`
          );
          particle.life -= 0.01;
          if (particle.hasCompleted) {
            particle.dispose();
          }
          particle.velocity.y += this.gravity * particle.weight;
          particle.velocity.x *= 0.995;
          particle.velocity.rotation *= 0.995;
          if (particle.life < 0.1)
            particle.element.style.setProperty("opacity", `${particle.life * 10}`);
        },
        dispose: () => {
          particle.life = 0;
          particle.element.parentElement?.removeChild(particle.element);
        },
      };
      
      particle.element.style.setProperty("background-color", particle.color);
      particle.update();
      return particle;
    }
  
    createFpsScheduler(maxFps = 60) {
      const fpsInterval = 1000 / maxFps;
      let then = window.performance.now();
      let elapsed = 0;
      let stopped = false;
  
      return (callback) => {
        function animate(now) {
          if (stopped) return;
  
          requestAnimationFrame(animate);
          elapsed = now - then;
  
          if (elapsed > fpsInterval) {
            then = now - (elapsed % fpsInterval);
            callback();
          }
        }
  
        requestAnimationFrame(animate);
  
        return function dispose() {
          stopped = true;
        };
      };
    }
  
    update() {
      if (this.particles.every((p) => p.hasCompleted)) {
        if (this.onCompleteCallback) this.onCompleteCallback();
        this.disposers.forEach((d) => d());
        this.completed = true;
        return;
      }
      this.particles.forEach((p) => p.update());
    }
  
    initialize() {
      // Create container if it doesn't exist
      if (!this.containerElement) {
        this.containerElement = document.createElement('div');
        this.containerElement.className = 'confetti-screen';
        document.body.appendChild(this.containerElement);
      }
  
      const boundingBox = (this.targetElement || this.containerElement).getBoundingClientRect();
      const { top, left, width, height } = boundingBox;
      const isScreenWideConfettiEffect = !this.targetElement;
      const totalPieces = Math.floor(this.amount);
  
      this.particles = Array(totalPieces)
        .fill(null)
        .map((n, i) => {
          const x =
            left +
            Math.random() * width +
            (Math.random() - 0.5) *
              (isScreenWideConfettiEffect ? window.innerWidth * 0.25 : 20);
          
          return this.createParticle(
            i,
            x,
            isScreenWideConfettiEffect
              ? 0 + Math.random() * 20
              : top + Math.random() * height + (Math.random() - 0.5) * 20,
            (i % 2 === 0
              ? Math.random() - 0.5 >= 0
                ? 1
                : -1
              : x > left + width / 2
                ? 1
                : -1) * (isScreenWideConfettiEffect ? -0.5 : 0.5),
            this.confettiColors[i % 5]
          );
        });
  
      this.containerElement.append(...this.particles.map((p) => p.element));
      const maxSixtyFpsScheduler = this.createFpsScheduler(60);
      this.disposers.push(maxSixtyFpsScheduler(() => this.update()));
    }
  
    dispose() {
      this.disposers.forEach((d) => d());
      this.particles.forEach((p) => p.dispose());
      if (this.containerElement) {
        this.containerElement.remove();
      }
    }
  }
  
  // Add necessary styles
  const style = document.createElement('style');
  style.textContent = `
    .confetti-screen {
      pointer-events: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
    }
    .confetti-screen b {
      position: absolute;
      display: block;
      width: 10px;
      height: 16px;
      opacity: 1;
    }
  `;
  document.head.appendChild(style);