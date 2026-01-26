import type { SceneDirector } from './scene-director';

export class UIControls {
  private director: SceneDirector;
  private container: HTMLElement;
  private panel: HTMLElement;
  private visible = false;

  constructor(director: SceneDirector, root: HTMLElement) {
    this.director = director;

    // Main Container (Bottom Right)
    this.container = document.createElement('div');
    this.container.style.cssText = `
        position: absolute;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        font-family: 'JetBrains Mono', monospace;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        pointer-events: none; /* Let clicks pass through empty space */
        gap: 8px;
    `;

    // Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = '/// CONTROLS';
    toggleBtn.style.cssText = `
        pointer-events: auto;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.8);
        padding: 8px 12px;
        font-size: 12px;
        cursor: pointer;
        backdrop-filter: blur(4px);
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 1px;
    `;
    toggleBtn.onmouseover = () => (toggleBtn.style.borderColor = '#fff');
    toggleBtn.onmouseout = () =>
      (toggleBtn.style.borderColor = 'rgba(255,255,255,0.2)');
    toggleBtn.onclick = () => this.toggle();

    // Panel
    this.panel = document.createElement('div');
    this.panel.style.cssText = `
        pointer-events: auto;
        background: rgba(10,10,12,0.85);
        border: 1px solid rgba(255,255,255,0.1);
        padding: 16px;
        width: 240px;
        display: none; /* Hidden by default */
        flex-direction: column;
        gap: 12px;
        backdrop-filter: blur(12px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    // Add Controls
    this.addSlider('Speed', 0, 2, 1, 0.1, v => {
      // We'll need to expose a speed multiplier in Director
      this.director.timeScale = v;
    });

    this.addSlider('Bloom', 0, 2, 0.6, 0.1, v => {
      this.director.bloomPass.strength = v;
    });

    this.addSlider('Aperture', 0.0001, 0.01, 0.0001, 0.0001, v => {
      // Bokeh Aperture (Blur amount)
      this.director.bokehPass.uniforms['aperture'].value = v;
    });

    this.addSlider('Trails', 0.0, 0.95, 0.0, 0.05, v => {
      // Afterimage Damp (0 = off, 0.95 = heavy trails)
      this.director.afterimagePass.uniforms['damp'].value = v;
    });

    this.addSlider('Exposure', 0.1, 2.0, 0.9, 0.1, v => {
      this.director.renderer.toneMappingExposure = v;
    });

    this.addToggle('Auto-Rotate', true, v => {
      this.director.autoRotate = v;
    });

    const sceneSelect = this.createSceneSelect();
    this.panel.appendChild(sceneSelect);

    this.container.appendChild(this.panel);
    this.container.appendChild(toggleBtn);
    root.appendChild(this.container);
  }

  toggle() {
    this.visible = !this.visible;
    this.panel.style.display = this.visible ? 'flex' : 'none';
  }

  addSlider(
    label: string,
    min: number,
    max: number,
    initial: number,
    step: number,
    callback: (val: number) => void
  ) {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

    const header = document.createElement('div');
    header.style.cssText =
      'display: flex; justify-content: space-between; color: #888; font-size: 10px; text-transform: uppercase;';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = label;
    const valSpan = document.createElement('span');
    valSpan.textContent = initial.toFixed(1);
    valSpan.style.color = '#fff';

    header.appendChild(nameSpan);
    header.appendChild(valSpan);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min.toString();
    input.max = max.toString();
    input.step = step.toString();
    input.value = initial.toString();
    input.style.cssText = 'width: 100%; cursor: pointer; accent-color: #fff;';

    input.oninput = e => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      valSpan.textContent = val.toFixed(1);
      callback(val);
    };

    row.appendChild(header);
    row.appendChild(input);
    this.panel.appendChild(row);
  }

  addToggle(label: string, initial: boolean, callback: (val: boolean) => void) {
    const row = document.createElement('div');
    row.style.cssText =
      'display: flex; justify-content: space-between; align-items: center; color: #aaa; font-size: 11px;';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = label;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = initial;
    input.style.cursor = 'pointer';

    input.onchange = e => callback((e.target as HTMLInputElement).checked);

    row.appendChild(nameSpan);
    row.appendChild(input);
    this.panel.appendChild(row);
  }

  createSceneSelect() {
    const container = document.createElement('div');
    container.style.cssText =
      'display: flex; flex-direction: column; gap: 4px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 4px;';

    const label = document.createElement('div');
    label.textContent = 'JUMP TO SCENE';
    label.style.cssText =
      'color: #888; font-size: 10px; text-transform: uppercase;';

    const select = document.createElement('select');
    select.style.cssText =
      'background: #222; color: #fff; border: 1px solid #444; padding: 4px; font-family: inherit; font-size: 11px;';

    // We need to access scenes from director. Assuming sceneById or chapters index.
    // We'll populate indices 0-15
    for (let i = 0; i <= 15; i++) {
      const opt = document.createElement('option');
      opt.value = i.toString();
      opt.textContent = `Scene ${i.toString().padStart(2, '0')}`;
      select.appendChild(opt);
    }

    select.onchange = e => {
      const idx = parseInt((e.target as HTMLSelectElement).value);
      // Assuming director has goToScene or similar public method, or we hack it
      this.director.scrollProgressTarget = idx;
    };

    container.appendChild(label);
    container.appendChild(select);
    return container;
  }
}
