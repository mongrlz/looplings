import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sourcePath = path.join(root, 'public/pets/prime-test/spritesheet.webp');
const outputDir = path.join(root, 'public/pets/prime-test');
const outputPath = path.join(outputDir, 'state-atlas.png');
const manifestPath = path.join(outputDir, 'state-atlas.json');

const cellWidth = 192;
const cellHeight = 208;
const atlasCols = 8;

const sourceRows = {
  idle: 0,
  failed: 5,
};

const states = [
  { id: 'idle', label: 'Idle breathing', fps: 5, mode: 'source-idle', frameCount: 8 },
];

const colors = {
  outline: '#151824',
  outlineSoft: '#25293a',
  body: '#fffdf2',
  bodyShadow: '#ebe8d8',
  mark: '#d9c8b9',
  eye: '#071524',
  eyeBlue: '#153c63',
  eyeShine: '#f9ffff',
  antenna: '#bdf3ff',
};

function wave(index, amount = 1, phase = 0) {
  return Math.sin(((index + phase) / atlasCols) * Math.PI * 2) * amount;
}

function triangle(index) {
  return 1 - Math.abs(((index % atlasCols) / 3.5) - 1);
}

function statePose(state, index) {
  const base = {
    x: 0,
    y: 0,
    headTilt: 0,
    bodySquash: 1,
    headSquash: 1,
    antennaTilt: 0,
    antennaY: 0,
    antennaScale: 1,
    leftArm: 8,
    rightArm: -8,
    leftArmY: 0,
    rightArmY: 0,
    leftFootY: 0,
    rightFootY: 0,
    eyes: 'open',
    eyeDx: 0,
    eyeDy: 0,
    mouth: 'flat',
    foreheadDy: 0,
  };

  switch (state) {
    case 'thinking':
      return {
        ...base,
        y: wave(index, 1.5),
        headTilt: wave(index, 2),
        antennaY: wave(index, -2, 1),
        antennaScale: 1 + triangle(index) * 0.06,
        leftArm: -14,
        leftArmY: -5,
        rightArm: -2,
        eyes: index % 4 === 3 ? 'focusBlink' : 'focus',
        eyeDy: index % 3 === 0 ? -1 : 0,
        mouth: 'dot',
      };
    case 'acting':
      return {
        ...base,
        x: wave(index, 3),
        y: index % 2 === 0 ? 0 : -2,
        headTilt: -4 + wave(index, 2),
        antennaTilt: -6,
        leftArm: -24 + wave(index, 7),
        rightArm: -20 + wave(index, 8, 2),
        leftArmY: -7,
        rightArmY: -4,
        leftFootY: index % 2 === 0 ? 0 : -4,
        rightFootY: index % 2 === 0 ? -4 : 0,
        eyes: 'determined',
        eyeDx: 1,
        mouth: 'flat',
      };
    case 'trading':
      return {
        ...base,
        x: [-4, -2, 1, 4, 2, -1, -3, 0][index],
        y: [0, -2, -1, -3, 0, -2, -1, 0][index],
        headTilt: [-4, -2, 2, 5, 3, -2, -5, 0][index],
        antennaTilt: [-8, -4, 3, 8, 5, -3, -8, 0][index],
        leftArm: [-20, -24, -16, -8, -18, -26, -16, -10][index],
        rightArm: [20, 12, 8, 18, 24, 14, 8, 20][index],
        leftFootY: index % 2 === 0 ? -3 : 0,
        rightFootY: index % 2 === 0 ? 0 : -3,
        eyes: 'side',
        eyeDx: index < 4 ? 2 : -2,
        mouth: 'tinyOpen',
      };
    case 'trade_win':
      return {
        ...base,
        y: [4, 0, -7, -13, -9, -3, 1, 3][index],
        bodySquash: [1.04, 1, 0.97, 0.95, 0.97, 1, 1.02, 1.03][index],
        antennaY: [2, 0, -3, -5, -3, -1, 1, 2][index],
        antennaScale: [0.96, 1, 1.06, 1.12, 1.08, 1.03, 1, 0.98][index],
        leftArm: [-38, -45, -50, -46, -40, -32, -24, -18][index],
        rightArm: [38, 45, 50, 46, 40, 32, 24, 18][index],
        leftArmY: -16,
        rightArmY: -16,
        leftFootY: index >= 2 && index <= 4 ? -6 : 0,
        rightFootY: index >= 2 && index <= 4 ? -6 : 0,
        eyes: 'happy',
        mouth: 'smile',
      };
    case 'trade_loss':
      return {
        ...base,
        y: [0, 2, 4, 6, 7, 6, 4, 2][index],
        headTilt: [0, -1, -3, -4, -4, -3, -1, 0][index],
        antennaY: [0, 1, 2, 3, 3, 2, 1, 0][index],
        antennaTilt: [-1, -2, -4, -5, -5, -4, -2, -1][index],
        leftArm: [4, 8, 13, 18, 20, 18, 12, 8][index],
        rightArm: [-4, -8, -13, -18, -20, -18, -12, -8][index],
        leftArmY: 8,
        rightArmY: 8,
        eyes: 'sad',
        eyeDy: 2,
        mouth: 'frown',
      };
    case 'posting':
      return {
        ...base,
        y: wave(index, 1.5),
        headTilt: [0, -2, -3, -2, 0, 1, 0, -1][index],
        antennaTilt: [0, -3, -5, -3, 0, 2, 0, -2][index],
        leftArm: [-12, -18, -24, -28, -22, -16, -10, -14][index],
        rightArm: [18, 32, 48, 58, 48, 34, 22, 18][index],
        rightArmY: [-2, -8, -17, -21, -17, -10, -4, -2][index],
        eyes: 'open',
        eyeDx: 1,
        mouth: 'dot',
      };
    case 'receiving':
      return {
        ...base,
        y: [0, -1, -2, -2, -1, 0, 1, 0][index],
        headTilt: [0, 2, 4, 5, 4, 2, 0, 1][index],
        antennaTilt: [0, 3, 5, 6, 4, 2, 0, 1][index],
        leftArm: [-20, -26, -32, -36, -30, -24, -18, -20][index],
        rightArm: [20, 26, 32, 36, 30, 24, 18, 20][index],
        leftArmY: [-2, -5, -8, -9, -7, -4, -2, -2][index],
        rightArmY: [-2, -5, -8, -9, -7, -4, -2, -2][index],
        eyes: 'wide',
        mouth: index > 1 && index < 5 ? 'tinyOpen' : 'dot',
      };
    case 'sleeping':
      return {
        ...base,
        y: [8, 9, 10, 11, 10, 9, 8, 9][index],
        headTilt: -8,
        bodySquash: [1.04, 1.05, 1.06, 1.07, 1.06, 1.05, 1.04, 1.05][index],
        antennaTilt: -12,
        antennaY: 6,
        leftArm: 18,
        rightArm: -18,
        leftArmY: 9,
        rightArmY: 9,
        eyes: 'closed',
        mouth: 'soft',
      };
    case 'low_compute':
      return {
        ...base,
        y: [4, 6, 8, 10, 10, 8, 6, 5][index],
        headTilt: [-2, -4, -6, -7, -7, -5, -3, -2][index],
        bodySquash: 0.98,
        antennaTilt: [-8, -10, -12, -14, -14, -12, -10, -8][index],
        antennaY: [3, 4, 5, 6, 6, 5, 4, 3][index],
        antennaScale: 0.92,
        leftArm: 22,
        rightArm: -22,
        leftArmY: 13,
        rightArmY: 13,
        eyes: 'weak',
        eyeDy: 3,
        mouth: 'frown',
        foreheadDy: 2,
      };
    case 'critical':
      return {
        ...base,
        x: [-3, 4, -4, 3, -2, 4, -3, 2][index],
        y: [0, -3, 2, -4, 1, -2, 3, -1][index],
        headTilt: [-7, 8, -9, 7, -5, 9, -8, 5][index],
        bodySquash: [1, 0.96, 1.04, 0.97, 1.03, 0.96, 1.02, 1][index],
        antennaTilt: [12, -14, 16, -12, 15, -15, 11, -10][index],
        antennaY: [-2, 2, -3, 3, -2, 2, -1, 1][index],
        antennaScale: [1.02, 0.92, 1.08, 0.9, 1.06, 0.93, 1.04, 0.96][index],
        leftArm: [-42, -32, -46, -30, -44, -34, -48, -32][index],
        rightArm: [42, 32, 46, 30, 44, 34, 48, 32][index],
        leftArmY: -16,
        rightArmY: -16,
        leftFootY: index % 2 === 0 ? -2 : 2,
        rightFootY: index % 2 === 0 ? 2 : -2,
        eyes: 'panic',
        mouth: 'open',
      };
    case 'dead':
      return {
        ...base,
        eyes: 'dead',
        mouth: 'dead',
      };
    default:
      return base;
  }
}

function eyeSvg(kind, x, y, side, dx, dy) {
  const sx = x + dx;
  const sy = y + dy;
  if (kind === 'closed') {
    return `<path d="M${sx - 9} ${sy + 2} Q ${sx} ${sy + 8} ${sx + 9} ${sy + 2}" fill="none" stroke="${colors.outline}" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (kind === 'focusBlink') {
    return `<rect x="${sx - 8}" y="${sy + 1}" width="16" height="5" rx="2" fill="${colors.eyeBlue}" stroke="${colors.outline}" stroke-width="3"/>`;
  }
  if (kind === 'sad' || kind === 'weak') {
    return `
      <path d="M${sx - 10} ${sy - 4} Q ${sx} ${sy - 11} ${sx + 10} ${sy - 4}" fill="none" stroke="${colors.outline}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="${sx}" cy="${sy + 4}" rx="${kind === 'weak' ? 7 : 9}" ry="${kind === 'weak' ? 12 : 14}" fill="${colors.eye}" stroke="${colors.outline}" stroke-width="2"/>
      <ellipse cx="${sx + side * 3}" cy="${sy}" rx="3" ry="4" fill="${colors.eyeShine}"/>
    `;
  }
  if (kind === 'happy') {
    return `
      <ellipse cx="${sx}" cy="${sy}" rx="10" ry="13" fill="${colors.eye}" stroke="${colors.outline}" stroke-width="2"/>
      <circle cx="${sx + side * 4}" cy="${sy - 5}" r="4" fill="${colors.eyeShine}"/>
      <path d="M${sx - 7} ${sy + 2} Q ${sx} ${sy + 9} ${sx + 7} ${sy + 2}" fill="none" stroke="${colors.eyeBlue}" stroke-width="3" stroke-linecap="round"/>
    `;
  }
  if (kind === 'panic') {
    return `
      <ellipse cx="${sx}" cy="${sy}" rx="12" ry="16" fill="${colors.eye}" stroke="${colors.outline}" stroke-width="2"/>
      <circle cx="${sx - side * 2}" cy="${sy - 5}" r="5" fill="${colors.eyeShine}"/>
      <circle cx="${sx + side * 4}" cy="${sy + 4}" r="2" fill="${colors.eyeShine}"/>
    `;
  }
  if (kind === 'determined') {
    return `
      <path d="M${sx - 11} ${sy - 9} L${sx + 9} ${sy - 5} L${sx + 9} ${sy + 12} Q${sx} ${sy + 17} ${sx - 9} ${sy + 12} Z" fill="${colors.eye}" stroke="${colors.outline}" stroke-width="2"/>
      <circle cx="${sx + side * 3}" cy="${sy - 2}" r="4" fill="${colors.eyeShine}"/>
    `;
  }
  if (kind === 'side') {
    return `
      <ellipse cx="${sx}" cy="${sy}" rx="10" ry="13" fill="${colors.eye}" stroke="${colors.outline}" stroke-width="2"/>
      <ellipse cx="${sx + dx + side * 2}" cy="${sy - 4}" rx="4" ry="5" fill="${colors.eyeShine}"/>
    `;
  }
  if (kind === 'dead') {
    return `<path d="M${sx - 9} ${sy} L${sx + 9} ${sy}" stroke="${colors.outline}" stroke-width="4" stroke-linecap="round"/>`;
  }
  return `
    <ellipse cx="${sx}" cy="${sy}" rx="${kind === 'wide' ? 11 : 10}" ry="${kind === 'wide' ? 15 : 14}" fill="${colors.eye}" stroke="${colors.outline}" stroke-width="2"/>
    <ellipse cx="${sx + side * 3}" cy="${sy - 5}" rx="4" ry="5" fill="${colors.eyeShine}"/>
    <rect x="${sx - 5}" y="${sy + 4}" width="5" height="8" rx="2" fill="${colors.eyeBlue}" opacity="0.9"/>
  `;
}

function mouthSvg(kind, x, y) {
  if (kind === 'smile') {
    return `<path d="M${x - 8} ${y} Q ${x} ${y + 8} ${x + 8} ${y}" fill="none" stroke="${colors.outline}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (kind === 'frown') {
    return `<path d="M${x - 8} ${y + 5} Q ${x} ${y - 2} ${x + 8} ${y + 5}" fill="none" stroke="${colors.outline}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (kind === 'open') {
    return `<ellipse cx="${x}" cy="${y + 2}" rx="5" ry="7" fill="${colors.outline}"/>`;
  }
  if (kind === 'tinyOpen') {
    return `<ellipse cx="${x}" cy="${y + 2}" rx="4" ry="3" fill="${colors.outline}"/>`;
  }
  if (kind === 'dot') {
    return `<rect x="${x - 2}" y="${y}" width="4" height="4" rx="2" fill="${colors.outline}"/>`;
  }
  if (kind === 'soft') {
    return `<path d="M${x - 5} ${y + 1} Q ${x} ${y + 4} ${x + 5} ${y + 1}" fill="none" stroke="${colors.outline}" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (kind === 'dead') {
    return `<path d="M${x - 8} ${y + 3} L${x + 8} ${y + 3}" stroke="${colors.outline}" stroke-width="3" stroke-linecap="round"/>`;
  }
  return `<path d="M${x - 7} ${y + 2} L${x + 7} ${y + 2}" stroke="${colors.outline}" stroke-width="3" stroke-linecap="round"/>`;
}

function foreheadMark(x, y) {
  return `
    <rect x="${x - 2}" y="${y - 10}" width="4" height="4" fill="${colors.mark}"/>
    <rect x="${x - 1}" y="${y - 3}" width="2" height="6" fill="${colors.mark}"/>
    <rect x="${x - 2}" y="${y + 6}" width="4" height="4" fill="${colors.mark}"/>
  `;
}

function standingPrimeSvg(state, index) {
  const p = statePose(state, index);
  const cx = 96 + p.x;
  const headY = 82 + p.y;
  const bodyY = 150 + p.y;
  const leftEyeX = cx - 23;
  const rightEyeX = cx + 23;
  const eyeY = headY + 9;
  const stemTop = headY - 64 + p.antennaY;
  const stemBottom = headY - 43 + p.antennaY;

  return `
    <svg width="${cellWidth}" height="${cellHeight}" viewBox="0 0 ${cellWidth} ${cellHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none"/>
      <g transform="rotate(${p.headTilt} ${cx} ${headY})">
        <g transform="rotate(${p.antennaTilt} ${cx} ${stemBottom}) scale(${p.antennaScale}) translate(${cx * (1 / p.antennaScale - 1)} ${stemTop * (1 / p.antennaScale - 1)})">
          <path d="M${cx} ${stemBottom} L${cx} ${stemTop + 18}" stroke="${colors.outline}" stroke-width="7" stroke-linecap="round"/>
          <path d="M${cx} ${stemBottom} L${cx} ${stemTop + 18}" stroke="${colors.antenna}" stroke-width="4" stroke-linecap="round"/>
          <circle cx="${cx}" cy="${stemTop + 10}" r="15" fill="none" stroke="${colors.outline}" stroke-width="7"/>
          <circle cx="${cx}" cy="${stemTop + 10}" r="15" fill="none" stroke="${colors.antenna}" stroke-width="4"/>
        </g>
        <ellipse cx="${cx}" cy="${headY}" rx="45" ry="${50 * p.headSquash}" fill="${colors.outline}"/>
        <ellipse cx="${cx}" cy="${headY - 1}" rx="40" ry="${46 * p.headSquash}" fill="${colors.body}"/>
        <path d="M${cx - 35} ${headY + 27} Q${cx} ${headY + 50} ${cx + 35} ${headY + 27}" fill="${colors.bodyShadow}" opacity="0.55"/>
        ${foreheadMark(cx, headY - 8 + p.foreheadDy)}
        ${eyeSvg(p.eyes, leftEyeX, eyeY, -1, p.eyeDx, p.eyeDy)}
        ${eyeSvg(p.eyes, rightEyeX, eyeY, 1, p.eyeDx, p.eyeDy)}
        ${mouthSvg(p.mouth, cx, headY + 34)}
      </g>
      <g transform="translate(${p.x} ${p.y}) scale(1 ${p.bodySquash}) translate(0 ${bodyY * (1 / p.bodySquash - 1)})">
        <path d="M65 ${bodyY - 10} Q66 ${bodyY - 39} 96 ${bodyY - 41} Q126 ${bodyY - 39} 127 ${bodyY - 10} L127 ${bodyY + 24} Q121 ${bodyY + 43} 104 ${bodyY + 39} Q96 ${bodyY + 46} 88 ${bodyY + 39} Q71 ${bodyY + 43} 65 ${bodyY + 24} Z" fill="${colors.outline}"/>
        <path d="M70 ${bodyY - 11} Q71 ${bodyY - 34} 96 ${bodyY - 36} Q121 ${bodyY - 34} 122 ${bodyY - 11} L122 ${bodyY + 21} Q117 ${bodyY + 34} 104 ${bodyY + 31} Q96 ${bodyY + 37} 88 ${bodyY + 31} Q75 ${bodyY + 34} 70 ${bodyY + 21} Z" fill="${colors.body}"/>
        <path d="M74 ${bodyY + 13} Q96 ${bodyY + 30} 118 ${bodyY + 13} L118 ${bodyY + 23} Q112 ${bodyY + 35} 104 ${bodyY + 31} Q96 ${bodyY + 37} 88 ${bodyY + 31} Q80 ${bodyY + 35} 74 ${bodyY + 23} Z" fill="${colors.bodyShadow}" opacity="0.55"/>
      </g>
      <g transform="translate(${p.x} ${p.y})">
        <rect x="48" y="${133 + p.leftArmY}" width="16" height="34" rx="8" fill="${colors.outline}" transform="rotate(${p.leftArm} 56 ${150 + p.leftArmY})"/>
        <rect x="52" y="${136 + p.leftArmY}" width="10" height="27" rx="5" fill="${colors.body}" transform="rotate(${p.leftArm} 57 ${149 + p.leftArmY})"/>
        <rect x="128" y="${133 + p.rightArmY}" width="16" height="34" rx="8" fill="${colors.outline}" transform="rotate(${p.rightArm} 136 ${150 + p.rightArmY})"/>
        <rect x="130" y="${136 + p.rightArmY}" width="10" height="27" rx="5" fill="${colors.body}" transform="rotate(${p.rightArm} 135 ${149 + p.rightArmY})"/>
        <rect x="77" y="${169 + p.leftFootY}" width="18" height="24" rx="8" fill="${colors.outline}"/>
        <rect x="81" y="${169 + p.leftFootY}" width="12" height="19" rx="5" fill="${colors.body}"/>
        <rect x="99" y="${169 + p.rightFootY}" width="18" height="24" rx="8" fill="${colors.outline}"/>
        <rect x="101" y="${169 + p.rightFootY}" width="12" height="19" rx="5" fill="${colors.body}"/>
      </g>
      <g transform="rotate(${p.headTilt} ${cx} ${headY})">
        <ellipse cx="${cx}" cy="${headY}" rx="45" ry="${50 * p.headSquash}" fill="${colors.outline}"/>
        <ellipse cx="${cx}" cy="${headY - 1}" rx="40" ry="${46 * p.headSquash}" fill="${colors.body}"/>
        <path d="M${cx - 35} ${headY + 27} Q${cx} ${headY + 50} ${cx + 35} ${headY + 27}" fill="${colors.bodyShadow}" opacity="0.55"/>
        ${foreheadMark(cx, headY - 8 + p.foreheadDy)}
        ${eyeSvg(p.eyes, leftEyeX, eyeY, -1, p.eyeDx, p.eyeDy)}
        ${eyeSvg(p.eyes, rightEyeX, eyeY, 1, p.eyeDx, p.eyeDy)}
        ${mouthSvg(p.mouth, cx, headY + 34)}
      </g>
    </svg>
  `;
}

function deadPrimeSvg() {
  return `
    <svg width="${cellWidth}" height="${cellHeight}" viewBox="0 0 ${cellWidth} ${cellHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="none"/>
      <g transform="translate(0 4)">
        <rect x="16" y="134" width="30" height="14" rx="7" fill="${colors.outline}" transform="rotate(-9 31 141)"/>
        <rect x="20" y="137" width="22" height="8" rx="4" fill="${colors.body}" transform="rotate(-9 31 141)"/>
        <rect x="45" y="166" width="32" height="15" rx="8" fill="${colors.outline}" transform="rotate(9 61 174)"/>
        <rect x="49" y="169" width="24" height="9" rx="5" fill="${colors.body}" transform="rotate(9 61 174)"/>

        <path d="M38 123 Q44 94 78 96 L105 98 Q130 101 134 126 L135 150 Q128 173 106 168 Q96 180 83 168 Q54 173 42 151 Z" fill="${colors.outline}"/>
        <path d="M45 123 Q51 103 79 103 L103 105 Q124 108 128 128 L128 147 Q123 162 106 158 Q96 169 84 158 Q59 162 49 148 Z" fill="${colors.body}"/>
        <path d="M51 145 Q86 163 123 145 L123 151 Q117 162 106 158 Q96 169 84 158 Q63 161 52 151 Z" fill="${colors.bodyShadow}" opacity="0.58"/>

        <ellipse cx="106" cy="117" rx="55" ry="39" fill="${colors.outline}"/>
        <ellipse cx="105" cy="117" rx="50" ry="34" fill="${colors.body}"/>
        <path d="M66 139 Q104 153 142 138" fill="${colors.bodyShadow}" opacity="0.48"/>

        <path d="M148 117 L164 117" stroke="${colors.outline}" stroke-width="7" stroke-linecap="round"/>
        <path d="M148 117 L164 117" stroke="${colors.antenna}" stroke-width="4" stroke-linecap="round"/>
        <circle cx="174" cy="117" r="13" fill="none" stroke="${colors.outline}" stroke-width="7"/>
        <circle cx="174" cy="117" r="13" fill="none" stroke="${colors.antenna}" stroke-width="4"/>

        <rect x="100" y="107" width="4" height="4" fill="${colors.mark}"/>
        <rect x="101" y="114" width="2" height="6" fill="${colors.mark}"/>
        <rect x="100" y="123" width="4" height="4" fill="${colors.mark}"/>
        <path d="M81 110 Q90 116 99 110" fill="none" stroke="${colors.outline}" stroke-width="4" stroke-linecap="round"/>
        <path d="M116 110 Q125 116 134 110" fill="none" stroke="${colors.outline}" stroke-width="4" stroke-linecap="round"/>
        <path d="M96 132 Q105 137 114 132" fill="none" stroke="${colors.outline}" stroke-width="3" stroke-linecap="round"/>

        <rect x="38" y="105" width="15" height="36" rx="8" fill="${colors.outline}" transform="rotate(77 46 123)"/>
        <rect x="41" y="109" width="10" height="28" rx="5" fill="${colors.body}" transform="rotate(77 46 123)"/>
        <rect x="126" y="149" width="15" height="36" rx="8" fill="${colors.outline}" transform="rotate(-66 134 167)"/>
        <rect x="129" y="153" width="10" height="28" rx="5" fill="${colors.body}" transform="rotate(-66 134 167)"/>
        <rect x="87" y="161" width="18" height="27" rx="8" fill="${colors.outline}" transform="rotate(88 96 175)"/>
        <rect x="91" y="165" width="12" height="20" rx="5" fill="${colors.body}" transform="rotate(88 97 175)"/>
        <rect x="111" y="157" width="18" height="27" rx="8" fill="${colors.outline}" transform="rotate(-78 120 171)"/>
        <rect x="115" y="161" width="12" height="20" rx="5" fill="${colors.body}" transform="rotate(-78 121 171)"/>
      </g>
    </svg>
  `;
}

async function sourceIdleCell(frame) {
  const sourceFrame = frame % 6;
  return sharp(sourcePath)
    .extract({
      left: sourceFrame * cellWidth,
      top: sourceRows.idle * cellHeight,
      width: cellWidth,
      height: cellHeight,
    })
    .png()
    .toBuffer();
}

async function sourceFailedCell(frame) {
  return sharp(sourcePath)
    .extract({
      left: frame * cellWidth,
      top: sourceRows.failed * cellHeight,
      width: cellWidth,
      height: cellHeight,
    })
    .png()
    .toBuffer();
}

async function rigFrame(state, index) {
  const svg = state === 'dead' ? deadPrimeSvg() : standingPrimeSvg(state, index);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function stateFrame(row, index) {
  if (row.mode === 'source-idle') return sourceIdleCell(index);
  if (row.mode === 'source-failed') return sourceFailedCell(index);
  if (row.id === 'dead') return index === 0 ? rigFrame(row.id, 0) : transparentCell();
  return rigFrame(row.id, index);
}

function transparentCell() {
  return sharp({
    create: {
      width: cellWidth,
      height: cellHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).png().toBuffer();
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const composites = [];
  for (let rowIndex = 0; rowIndex < states.length; rowIndex += 1) {
    const row = states[rowIndex];
    for (let frameIndex = 0; frameIndex < atlasCols; frameIndex += 1) {
      const frame = await stateFrame(row, frameIndex);
      composites.push({
        input: frame,
        left: frameIndex * cellWidth,
        top: rowIndex * cellHeight,
      });
    }
  }

  await sharp({
    create: {
      width: atlasCols * cellWidth,
      height: states.length * cellHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);

  await fs.writeFile(
    manifestPath,
    `${JSON.stringify({
      sprite: 'prime-test-l01',
      atlas: path.relative(root, outputPath),
      cellWidth,
      cellHeight,
      columns: atlasCols,
      rows: states.map(({ id, label, fps, frameCount }, row) => ({
        id,
        label,
        row,
        frameCount,
        fps,
      })),
    }, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
