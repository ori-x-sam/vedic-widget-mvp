// THE FAKE ENDING (brief §3): after Record 37 the reader closes on its back
// cover — THE END · ସମାପ୍ତ, fake credits, the Progress Report, a Play again
// button. At 6 s (or on any click) the print misregisters, the year rolls
// past 2026, the page tears along its perforation and a thin Supplementary
// Reader slips out. Three conch blasts later the game resumes with no menu.
import Phaser from 'phaser';
import { audio } from '../audio';
import { input } from '../systems/input';
import { journey, newJourney } from '../systems/journey';
import { save } from '../systems/save';
import { applyLayout } from '../ui/layout';
import { grade, fmtTime } from '../ui/pages';
import { goToRun } from './flow';
import { isReducedMotion } from './util';

const $ = (id: string) => document.getElementById(id)!;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class FakeEnding extends Phaser.Scene {
  constructor() {
    super('FakeEnding');
  }

  create(): void {
    const app = $('app');
    app.classList.remove('is-title');
    app.classList.add('is-playing', 'is-ending');
    applyLayout();
    input.enabled = false;
    audio.stop();
    audio.conch(2.6);
    void this.run();
  }

  private async run(): Promise<void> {
    const reduced = isReducedMotion();
    const j = journey();
    const stats = { cowries: j.cowries, diyasLost: j.diyasLost, time: j.time, caught: j.caught.length, total: 37, assisted: j.assisted };
    const g = grade(stats);
    const el = $('ending');
    const cover = `
      <div class="cover-page">
        <div class="cv-top"><span>Ama Kalinga · A Picture Reader</span><span lang="or">ଆମ କଳିଙ୍ଗ</span></div>
        <div class="cv-end">THE END<span class="cv-or" lang="or">ସମାପ୍ତ</span></div>
        <div class="cv-credits">
          <p><b>Story</b> 3,500 years of Kalinga and Odisha</p>
          <p><b>Starring</b> Taapoi · the sadhabas · builders, poets, printers, farmers, riders and you</p>
          <p><b>Report</b> Records ${stats.caught} / 37 · Cowries ${stats.cowries} · Diyas lost ${stats.diyasLost} · Time ${fmtTime(stats.time)} · Grade <b class="cv-grade">${g.grade}</b>${stats.assisted ? ' · Assisted' : ''}</p>
          <p class="cv-remark">“${g.remark}”</p>
        </div>
        <div class="cv-bottom"><span>Printed at Ama Kalinga Press, Cuttack</span><span>Price ₹ 2.50</span></div>
        <div class="cv-perf" aria-hidden="true"></div>
        <button type="button" class="btn btn-gold cv-again">Play again</button>
      </div>`;
    el.innerHTML = `<div class="cover" role="dialog" aria-label="The end">
        <div class="plate plate-a" aria-hidden="true">${cover}</div>
        <div class="plate plate-b" aria-hidden="true">${cover}</div>
        <div class="plate plate-main">${cover}</div>
        <div class="year" aria-hidden="true">2026</div>
      </div>`;
    el.classList.add('open');
    await wait(60);
    el.classList.add('shown');

    // 6 s, or immediately on any click / press.
    await new Promise<void>((resolve) => {
      const done = () => { clearTimeout(timer); el.removeEventListener('pointerdown', done); offPress(); resolve(); };
      const timer = setTimeout(done, 6000);
      el.addEventListener('pointerdown', done);
      input.enabled = true;
      const offPress = input.onPress(done);
    });
    input.enabled = false;
    save((d) => { d.seenTwist = true; });

    // The print misregisters; the year rolls on; the page tears.
    audio.sfx('glitch');
    const year = el.querySelector('.year') as HTMLElement;
    if (!reduced) el.classList.add('glitch');
    for (let y = 2027; y <= 2036; y++) {
      year.textContent = String(y);
      await wait(y < 2031 ? 170 : 90);
      if (y === 2031) audio.sfx('glitch');
    }
    year.textContent = '∞';
    await wait(300);
    if (!reduced) el.classList.add('tear');
    audio.sfx('page');
    await wait(reduced ? 200 : 900);

    // The pamphlet slips out.
    el.insertAdjacentHTML('beforeend', `
      <div class="pamphlet" role="dialog" aria-label="Supplementary Reader">
        <div class="pm-top">Supplementary Reader</div>
        <div class="pm-title"><span lang="or">ଭବିଷ୍ୟତ</span><span>The Future</span></div>
        <div class="pm-stamp">Not in syllabus</div>
        <div class="pm-count" aria-live="assertive"></div>
      </div>`);
    await wait(80);
    el.classList.add('pamphlet-in');
    await wait(1400);
    const count = el.querySelector('.pm-count') as HTMLElement;
    for (const n of [3, 2, 1]) {
      count.textContent = String(n);
      count.classList.remove('pop');
      void count.offsetWidth;
      count.classList.add('pop');
      audio.conch(0.75);
      await wait(950);
    }

    // Into the future, no menu. /37 → /45.
    if (j.recordId !== 'f1') {
      if (j.recordId === 'r37') j.recordId = 'f1';
      else newJourney('f1');
    }
    journey().resumeScroll = 0;
    save((d) => {
      if (d.run) d.run.checkpoint = 'f1';
      d.actReached = Math.max(d.actReached, 7);
    });
    el.classList.remove('open', 'shown', 'glitch', 'tear', 'pamphlet-in');
    el.innerHTML = '';
    $('app').classList.remove('is-ending');
    input.enabled = true;
    input.clear();
    void goToRun(this);
  }
}
