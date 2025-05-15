import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 700;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const explodeBtn = document.createElement('button');
explodeBtn.className = 'freeze-btn';
explodeBtn.innerText = 'view portfolio';
explodeBtn.style.position = 'absolute';
explodeBtn.style.bottom = '6%';
explodeBtn.style.left = '50%';
explodeBtn.style.transform = 'translateX(-50%)';
explodeBtn.style.padding = '10px 20px';
explodeBtn.style.fontSize = '16px';
explodeBtn.style.cursor = 'pointer';
document.body.appendChild(explodeBtn);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const intersectPoint = new THREE.Vector3();

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const images = ['l-shape.png', 'l-2.png'];
let currentImageIndex = 0;
let points, originalPositions = [], targetPositions = [];

let velocities = [];
let freezeMode = false;

function loadImageToParticles(filename) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = '/' + filename;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const width = img.width;
      const height = img.height;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height).data;

      const positions = [];
      const scale = 0.5;

      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const i = (y * width + x) * 4;
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];

          if (r > 200 && g > 200 && b > 200) {
            positions.push((x - width / 2) * scale);
            positions.push((height / 2 - y) * scale);
            positions.push(0);
          }
        }
      }

      resolve(positions);
    };
  });
}

async function setupInitialParticles() {
  originalPositions = await loadImageToParticles(images[0]);
  targetPositions = originalPositions.slice();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(originalPositions, 3));

  velocities = new Array(originalPositions.length).fill(0);

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  animate();
}

window.addEventListener('click', async () => {
  if (freezeMode) return;
  currentImageIndex = (currentImageIndex + 1) % images.length;
  const newPositions = await loadImageToParticles(images[currentImageIndex]);

  const count = points.geometry.attributes.position.count;
  const newCount = newPositions.length / 3;

  if (newCount > count) {
    const padded = originalPositions.slice();
    while (padded.length < newPositions.length) padded.push(0);
    originalPositions = padded;
    velocities = new Array(padded.length).fill(0);
    points.geometry.setAttribute('position', new THREE.Float32BufferAttribute(padded, 3));
  } else if (newCount < count) {
    newPositions.length = count * 3;
  }

  targetPositions = newPositions;
});

explodeBtn.addEventListener('click', () => {
  freezeMode = true;
  for (let i = 0; i < velocities.length; i += 3) {
    velocities[i] = (Math.random() - 0.5) * 30;
    velocities[i + 1] = (Math.random() - 0.5) * 30;
    velocities[i + 2] = (Math.random() - 0.5) * 30;
  }

  // Trigger fade and redirect
  setTimeout(() => {
    fadeOverlay.style.opacity = 1;
  }, 500);

  setTimeout(() => {
    window.location.href = 'https://www.liennguyendesign.com/work';
  }, 1500);
});


// explodeBtn.addEventListener('mouseleave', () => {
//   freezeMode = false;
// });

explodeBtn.addEventListener('mouseleave', () => {
  freezeMode = false;
});

function animate(time) {
  requestAnimationFrame(animate);

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, intersectPoint);

  if (points) {
    const pos = points.geometry.attributes.position.array;
    const count = pos.length / 3;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const current = new THREE.Vector3(pos[ix], pos[iy], pos[iz]);
      const target = new THREE.Vector3(
        targetPositions[ix] || 0,
        targetPositions[iy] || 0,
        targetPositions[iz] || 0
      );

      if (!freezeMode) {
        const toMouse = new THREE.Vector3().subVectors(current, intersectPoint);
        const dist = toMouse.length();

        if (dist < 60) {
          toMouse.normalize();
          const force = (60 - dist) * 0.5;
          velocities[ix] += toMouse.x * force;
          velocities[iy] += toMouse.y * force;
        }

        velocities[ix] += (target.x - pos[ix]) * 0.003;
        velocities[iy] += (target.y - pos[iy]) * 0.003;
        velocities[iz] += (target.z - pos[iz]) * 0.003;

        velocities[ix] *= 0.95;
        velocities[iy] *= 0.95;
        velocities[iz] *= 0.95;
      }

      pos[ix] += velocities[ix];
      pos[iy] += velocities[iy];
      pos[iz] += velocities[iz];
    }

    points.geometry.attributes.position.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

setupInitialParticles();


const fadeOverlay = document.createElement('div');
fadeOverlay.style.position = 'fixed';
fadeOverlay.style.top = 0;
fadeOverlay.style.left = 0;
fadeOverlay.style.width = '100vw';
fadeOverlay.style.height = '100vh';
fadeOverlay.style.backgroundColor = 'black';
fadeOverlay.style.opacity = 0;
fadeOverlay.style.pointerEvents = 'none';
fadeOverlay.style.transition = 'opacity 1s ease';
document.body.appendChild(fadeOverlay);
