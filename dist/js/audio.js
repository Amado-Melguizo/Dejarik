export class HoloAudio {
    context = null;
    enabled = true;
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
    tone(kind) {
        if (!this.enabled)
            return;
        this.context ??= new AudioContext();
        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const settings = {
            select: { start: 480, end: 620, duration: 0.08, volume: 0.035 },
            move: { start: 260, end: 520, duration: 0.18, volume: 0.045 },
            attack: { start: 150, end: 55, duration: 0.32, volume: 0.08 },
            victory: { start: 420, end: 880, duration: 0.7, volume: 0.055 }
        }[kind];
        oscillator.type = kind === 'attack' ? 'sawtooth' : 'sine';
        oscillator.frequency.setValueAtTime(settings.start, now);
        oscillator.frequency.exponentialRampToValueAtTime(settings.end, now + settings.duration);
        gain.gain.setValueAtTime(settings.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + settings.duration);
        oscillator.connect(gain).connect(this.context.destination);
        oscillator.start(now);
        oscillator.stop(now + settings.duration);
    }
}
