"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function BikeGameInline() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const getWidth = () => mount.clientWidth;
    const getHeight = () => mount.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2a1a3a, 80, 200);

    // Panoramic city background
    const bgTexture = new THREE.TextureLoader().load("/backgrounds/chiraq.jpg");
    bgTexture.wrapS = THREE.RepeatWrapping;
    const bgCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(150, 150, 120, 64, 1, true),
      new THREE.MeshBasicMaterial({ map: bgTexture, side: THREE.BackSide, fog: false })
    );
    bgCylinder.position.y = 30;
    scene.add(bgCylinder);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      65,
      getWidth() / getHeight(),
      0.1,
      300
    );
    camera.position.set(6, 4, 14);
    camera.lookAt(0, 1, -20);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(getWidth(), getHeight());
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x98d1a0, 0.4);
    scene.add(hemiLight);

    // ---- Road ----
    const roadGeometry = new THREE.PlaneGeometry(14, 500);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.z = -200;
    road.receiveShadow = true;
    scene.add(road);

    // Yellow center double line
    for (let i = -20; i < 80; i++) {
      const lineGeom = new THREE.PlaneGeometry(0.1, 4);
      const lineMat = new THREE.MeshStandardMaterial({ color: 0xddcc00 });
      const lineL = new THREE.Mesh(lineGeom, lineMat);
      lineL.rotation.x = -Math.PI / 2;
      lineL.position.set(-0.2, 0.01, -i * 6);
      scene.add(lineL);
      const lineR = new THREE.Mesh(lineGeom, lineMat);
      lineR.rotation.x = -Math.PI / 2;
      lineR.position.set(0.2, 0.01, -i * 6);
      scene.add(lineR);
    }

    // White dashed lane markings
    for (let i = -20; i < 60; i++) {
      const markGeom = new THREE.PlaneGeometry(0.15, 2.5);
      const markMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
      for (const lx of [-3.5, 3.5]) {
        const mark = new THREE.Mesh(markGeom, markMat);
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(lx, 0.01, -i * 8);
        scene.add(mark);
      }
    }

    // ---- Sidewalks ----
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xc8c0b0 });
    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.2, 500),
        sidewalkMat
      );
      sidewalk.position.set(side * 9, 0.1, -200);
      sidewalk.receiveShadow = true;
      scene.add(sidewalk);
    }

    // Sidewalk panel lines
    const jointMat = new THREE.MeshStandardMaterial({ color: 0x9a9488 });
    for (let z = 20; z > -250; z -= 3) {
      for (const side of [-9, 9]) {
        const joint = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 0.06),
          jointMat
        );
        joint.rotation.x = -Math.PI / 2;
        joint.position.set(side, 0.21, z);
        scene.add(joint);
      }
    }

    // ---- Curbs ----
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (const side of [-7, 7]) {
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.25, 500),
        curbMat
      );
      curb.position.set(side, 0.12, -200);
      scene.add(curb);
    }

    // ============================================================
    //  CHICAGO BUILDINGS
    // ============================================================
    const brickColors = [0x8B4513, 0x9C6644, 0xA0522D, 0x7B3F00, 0x6B3A2A, 0xB5651D];
    const stoneColors = [0xBEB8A7, 0xC5BFA7, 0xD2C9B0, 0xAFA899];

    function addWindows(parent: THREE.Group, w: number, h: number, d: number, baseY: number, side: number) {
      const rows = Math.floor((h - 1) / 2.8);
      const cols = Math.floor(w / 1.6);
      if (cols <= 0 || rows <= 0) return;
      const winGeom = new THREE.PlaneGeometry(0.7, 1.1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const winMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.3 ? 0x88bbdd : 0xaaddee,
            transparent: true,
            opacity: 0.7,
          });
          const win = new THREE.Mesh(winGeom, winMat);
          const wx = -w / 2 + 0.8 + c * (w / cols);
          const wy = baseY + 1.5 + r * 2.8;
          win.position.set(wx, wy, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
          if (side < 0) win.rotation.y = Math.PI;
          parent.add(win);
        }
      }
    }

    function createSkyscraper(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 6 + Math.random() * 3;
      const h = 25 + Math.random() * 20;
      const d = 6 + Math.random() * 3;
      const glassColors = [0x334455, 0x2a3a4a, 0x3a4a5a, 0x1a2a3a];
      const frameColors = [0x222222, 0x333344, 0x444455, 0x1a1a2a];

      const color = frameColors[Math.floor(Math.random() * frameColors.length)];
      const glass = glassColors[Math.floor(Math.random() * glassColors.length)];

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      const glassMat = new THREE.MeshStandardMaterial({
        color: glass,
        emissive: 0x112233,
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.8,
      });
      const rows = Math.floor(h / 2.5);
      const cols = Math.floor(w / 1.4);
      const winGeom = new THREE.PlaneGeometry(0.9, 1.8);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const win = new THREE.Mesh(winGeom, glassMat);
          win.position.set(
            -w / 2 + 0.7 + c * (w / cols),
            2 + r * 2.5,
            side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01
          );
          if (side < 0) win.rotation.y = Math.PI;
          group.add(win);
        }
      }

      const cornice = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.3, 0.5, d + 0.3),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
      );
      cornice.position.set(0, h, 0);
      group.add(cornice);

      if (Math.random() > 0.4) {
        const ac = new THREE.Mesh(
          new THREE.BoxGeometry(2, 1.2, 2),
          new THREE.MeshStandardMaterial({ color: 0x666666 })
        );
        ac.position.set(0, h + 0.6, 0);
        group.add(ac);
      }

      const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x444444 })
      );
      doorFrame.position.set(0, 1.4, side > 0 ? -d / 2 - 0.08 : d / 2 + 0.08);
      group.add(doorFrame);
      const doorGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 2.5),
        new THREE.MeshStandardMaterial({ color: 0x88bbcc, transparent: true, opacity: 0.5 })
      );
      doorGlass.position.set(0, 1.4, side > 0 ? -d / 2 - 0.1 : d / 2 + 0.1);
      if (side < 0) doorGlass.rotation.y = Math.PI;
      group.add(doorGlass);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    function createApartment(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 6 + Math.random() * 2;
      const d = 6;
      const floorH = 3.2;
      const floors = 3;
      const h = floorH * floors;

      const color = brickColors[Math.floor(Math.random() * brickColors.length)];

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      addWindows(group, w, h, d, 0, side);

      const roofShape = new THREE.Shape();
      roofShape.moveTo(-w / 2 - 0.3, 0);
      roofShape.lineTo(0, 2.5);
      roofShape.lineTo(w / 2 + 0.3, 0);
      roofShape.lineTo(-w / 2 - 0.3, 0);
      const roofGeom = new THREE.ExtrudeGeometry(roofShape, {
        depth: d + 0.3,
        bevelEnabled: false,
      });
      const roofColors = [0x6b3a2a, 0x5a2a1a, 0x7a4a3a, 0x4a3020];
      const roof = new THREE.Mesh(
        roofGeom,
        new THREE.MeshStandardMaterial({
          color: roofColors[Math.floor(Math.random() * roofColors.length)]
        })
      );
      roof.position.set(0, h, -(d + 0.3) / 2);
      roof.castShadow = true;
      group.add(roof);

      for (let f = 1; f < floors; f++) {
        const divider = new THREE.Mesh(
          new THREE.BoxGeometry(w + 0.1, 0.15, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x666655 })
        );
        divider.position.set(0, f * floorH, side > 0 ? -d / 2 - 0.05 : d / 2 + 0.05);
        group.add(divider);
      }

      const door = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 2.2),
        new THREE.MeshStandardMaterial({ color: 0x2a1a0a })
      );
      door.position.set(0, 1.1, side > 0 ? -d / 2 - 0.02 : d / 2 + 0.02);
      if (side < 0) door.rotation.y = Math.PI;
      group.add(door);

      for (let s = 0; s < 3; s++) {
        const step = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.15, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x999988 })
        );
        step.position.set(0, 0.08 + s * 0.15, side > 0 ? -d / 2 - 0.2 - s * 0.4 : d / 2 + 0.2 + s * 0.4);
        group.add(step);
      }

      if (Math.random() > 0.5) {
        const escapeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        for (let f = 1; f <= floors; f++) {
          const platform = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.05, 0.8),
            escapeMat
          );
          platform.position.set(w / 2 * 0.6, f * floorH - 0.5, side > 0 ? -d / 2 - 0.4 : d / 2 + 0.4);
          group.add(platform);
        }
      }

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    function createItalianIceStand(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 4;
      const h = 3.2;
      const d = 4;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0xE0F0FF })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      const servWin = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 1.5),
        new THREE.MeshStandardMaterial({ color: 0x335566 })
      );
      servWin.position.set(0, 2.0, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
      if (side < 0) servWin.rotation.y = Math.PI;
      group.add(servWin);

      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.1, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xcccccc })
      );
      counter.position.set(0, 1.2, side > 0 ? -d / 2 - 0.3 : d / 2 + 0.3);
      group.add(counter);

      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(w + 1, 0.12, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x22aa44 })
      );
      awning.position.set(0, h + 0.1, side > 0 ? -d / 2 - 0.9 : d / 2 + 0.9);
      group.add(awning);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(w + 1, 0.13, 0.5),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      stripe.position.set(0, h + 0.12, side > 0 ? -d / 2 - 0.9 : d / 2 + 0.9);
      group.add(stripe);

      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0xd4a357 })
      );
      cone.position.set(0, h + 1.5, 0);
      cone.rotation.x = Math.PI;
      group.add(cone);
      const scoop1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6699 })
      );
      scoop1.position.set(0, h + 2.2, 0);
      group.add(scoop1);
      const scoop2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x66ddff })
      );
      scoop2.position.set(0, h + 2.9, 0);
      group.add(scoop2);

      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.6, 0.1),
        new THREE.MeshStandardMaterial({ color: 0xff4488 })
      );
      sign.position.set(0, h + 0.5, side > 0 ? -d / 2 - 0.06 : d / 2 + 0.06);
      group.add(sign);

      const sdoor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x225533 })
      );
      sdoor.position.set(w / 2 - 0.6, 0.9, side > 0 ? -d / 2 - 0.02 : d / 2 + 0.02);
      if (side < 0) sdoor.rotation.y = Math.PI;
      group.add(sdoor);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    // Sears Tower (Willis Tower)
    function createSearsTower(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const towerColor = 0x1a1a1a;
      const glassColor = 0x223344;
      const w = 7;
      const d = 7;

      const baseH = 30;
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(w, baseH, d),
        new THREE.MeshStandardMaterial({ color: towerColor })
      );
      base.position.set(0, baseH / 2, 0);
      base.castShadow = true;
      group.add(base);

      const t2H = 12;
      const t2 = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.75, t2H, d * 0.75),
        new THREE.MeshStandardMaterial({ color: towerColor })
      );
      t2.position.set(0, baseH + t2H / 2, 0);
      t2.castShadow = true;
      group.add(t2);

      const t3H = 10;
      const t3 = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.5, t3H, d * 0.5),
        new THREE.MeshStandardMaterial({ color: towerColor })
      );
      t3.position.set(0, baseH + t2H + t3H / 2, 0);
      t3.castShadow = true;
      group.add(t3);

      const t4H = 6;
      const t4 = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.3, t4H, d * 0.3),
        new THREE.MeshStandardMaterial({ color: towerColor })
      );
      t4.position.set(0, baseH + t2H + t3H + t4H / 2, 0);
      t4.castShadow = true;
      group.add(t4);

      const totalH = baseH + t2H + t3H + t4H;

      const antennaMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      for (const ax of [-0.5, 0.5]) {
        const antenna = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 12, 6),
          antennaMat
        );
        antenna.position.set(ax, totalH + 6, 0);
        group.add(antenna);
      }

      const tiers = [
        { h: baseH, w: w, yBase: 0 },
        { h: t2H, w: w * 0.75, yBase: baseH },
        { h: t3H, w: w * 0.5, yBase: baseH + t2H },
      ];
      const winMat = new THREE.MeshStandardMaterial({
        color: glassColor,
        emissive: 0x112233,
        emissiveIntensity: 0.2,
      });
      for (const tier of tiers) {
        const rows = Math.floor(tier.h / 2);
        const cols = Math.floor(tier.w / 1.2);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const win = new THREE.Mesh(
              new THREE.PlaneGeometry(0.8, 1.4),
              winMat
            );
            const wx = -tier.w / 2 + 0.6 + c * (tier.w / cols);
            const wy = tier.yBase + 1.5 + r * 2;
            win.position.set(wx, wy, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
            if (side < 0) win.rotation.y = Math.PI;
            group.add(win);
          }
        }
      }

      const topLight = new THREE.PointLight(0xff3333, 2, 20);
      topLight.position.set(0, totalH + 12.5, 0);
      group.add(topLight);
      const topBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 1 })
      );
      topBulb.position.set(0, totalH + 12.5, 0);
      group.add(topBulb);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
    }

    createSearsTower(11, -60, 1);

    // ---- The Bean (Cloud Gate) ----
    const beanZ = -30;
    const beanX = -12;

    const plazaGeom = new THREE.PlaneGeometry(22, 28);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xbbbbaa });
    const plaza = new THREE.Mesh(plazaGeom, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(beanX, 0.02, beanZ);
    plaza.receiveShadow = true;
    scene.add(plaza);

    const beanGroup = new THREE.Group();
    const beanBody = new THREE.Mesh(
      new THREE.SphereGeometry(5, 32, 24, 0, Math.PI * 2, 0, Math.PI),
      new THREE.MeshPhongMaterial({
        color: 0xeeeeee,
        specular: 0xffffff,
        shininess: 200,
        reflectivity: 1.0,
      })
    );
    beanBody.scale.set(1.0, 0.55, 0.7);
    beanBody.position.set(0, 3.5, 0);
    beanBody.castShadow = true;
    beanGroup.add(beanBody);

    const archGeom = new THREE.SphereGeometry(3, 24, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
    const archMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      metalness: 1.0,
      roughness: 0.1,
      side: THREE.BackSide,
    });
    const arch = new THREE.Mesh(archGeom, archMat);
    arch.scale.set(1.0, 0.5, 0.7);
    arch.position.set(0, 0.5, 0);
    beanGroup.add(arch);

    beanGroup.position.set(beanX, 0, beanZ);
    scene.add(beanGroup);

    for (const [tx, tz] of [[-10, -6], [-10, 6], [-26, -6], [-26, 6]]) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.18, 2.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x5a3a1a })
      );
      trunk.position.set(beanX + (tx - beanX) * 0.3 + tx * 0.05, 1.25, beanZ + tz);
      scene.add(trunk);
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x2d7b2d })
      );
      canopy.position.set(trunk.position.x, 3.2, trunk.position.z);
      canopy.castShadow = true;
      scene.add(canopy);
    }

    // ---- Chicago Hot Dog Shop ----
    function createHotDogShop(x: number, z: number, side: number) {
      const group = new THREE.Group();
      const w = 6;
      const h = 4;
      const d = 5;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color: 0xffdd00 })
      );
      body.position.set(0, h / 2, 0);
      body.castShadow = true;
      group.add(body);

      const roofTrim = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3),
        new THREE.MeshStandardMaterial({ color: 0xcc0000 })
      );
      roofTrim.position.set(0, h, 0);
      group.add(roofTrim);

      const frontWin = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 1.5, 2),
        new THREE.MeshStandardMaterial({ color: 0x88ccdd, transparent: true, opacity: 0.5 })
      );
      frontWin.position.set(0, 2.2, side > 0 ? -d / 2 - 0.01 : d / 2 + 0.01);
      if (side < 0) frontWin.rotation.y = Math.PI;
      group.add(frontWin);

      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.5, 0.12, 1.5),
        new THREE.MeshStandardMaterial({ color: 0xcc0000 })
      );
      awning.position.set(0, 3.5, side > 0 ? -d / 2 - 0.8 : d / 2 + 0.8);
      group.add(awning);
      const awningStripe = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.5, 0.13, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      awningStripe.position.set(0, 3.52, side > 0 ? -d / 2 - 0.8 : d / 2 + 0.8);
      group.add(awningStripe);

      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(4, 1, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xcc0000 })
      );
      signBoard.position.set(0, h + 0.8, side > 0 ? -d / 2 - 0.1 : d / 2 + 0.1);
      group.add(signBoard);

      const bunGeom = new THREE.CapsuleGeometry(0.5, 2.5, 8, 12);
      const bun = new THREE.Mesh(
        bunGeom,
        new THREE.MeshStandardMaterial({ color: 0xd4a04a })
      );
      bun.rotation.z = Math.PI / 2;
      bun.position.set(0, h + 2.2, 0);
      group.add(bun);

      const sausage = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.35, 2.8, 8, 12),
        new THREE.MeshStandardMaterial({ color: 0x8B2500 })
      );
      sausage.rotation.z = Math.PI / 2;
      sausage.position.set(0, h + 2.5, 0);
      group.add(sausage);

      const mustard = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.08, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xffdd00, emissive: 0xffdd00, emissiveIntensity: 0.3 })
      );
      mustard.position.set(0, h + 2.7, 0.1);
      group.add(mustard);

      const relish = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.08, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x22aa22 })
      );
      relish.position.set(0, h + 2.65, -0.1);
      group.add(relish);

      const hdDoor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 2),
        new THREE.MeshStandardMaterial({ color: 0x661100 })
      );
      hdDoor.position.set(-w / 2 + 0.7, 1, side > 0 ? -d / 2 - 0.02 : d / 2 + 0.02);
      if (side < 0) hdDoor.rotation.y = Math.PI;
      group.add(hdDoor);

      group.position.set(x + side * (w / 2 + 0.5), 0, z);
      scene.add(group);
      return { w, d };
    }

    createHotDogShop(-11, 3, -1);

    // Generate the Chicago streetscape
    const beanZoneMin = beanZ - 18;
    const beanZoneMax = beanZ + 18;
    const buildingTypes = [createHotDogShop, createItalianIceStand, createApartment, createSkyscraper];
    for (const side of [-1, 1]) {
      let z = 5;
      while (z > -250) {
        if (side === -1 && z < beanZoneMax && z > beanZoneMin) {
          z = beanZoneMin - 1;
          continue;
        }
        if (side === -1 && z > -3 && z < 8) {
          z = -4;
          continue;
        }

        const r = Math.random();
        let type: number;
        if (r < 0.15) type = 0;
        else if (r < 0.30) type = 1;
        else if (r < 0.60) type = 2;
        else type = 3;

        const baseX = side > 0 ? 11 : -11;
        const result = buildingTypes[type](baseX, z, side);
        z -= result.d + 1 + Math.random() * 2;
      }
    }

    // ---- Streetlights ----
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a5a2a });
    for (let z = 5; z > -200; z -= 18) {
      for (const side of [-7.2, 7.2]) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.12, 5.5, 8),
          lampMat
        );
        pole.position.set(side, 2.75, z);
        pole.castShadow = true;
        scene.add(pole);

        const top = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 8, 8),
          lampMat
        );
        top.position.set(side, 5.5, z);
        scene.add(top);

        for (const lo of [-0.4, 0.4]) {
          const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6),
            lampMat
          );
          arm.rotation.z = Math.PI / 2;
          arm.position.set(side + lo * 0.6, 5.3, z);
          scene.add(arm);

          const globe = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshStandardMaterial({
              color: 0xfffff0,
              emissive: 0xfffff0,
              emissiveIntensity: 0.15,
            })
          );
          globe.position.set(side + lo, 5.3, z);
          scene.add(globe);
        }
      }
    }

    // ---- Parking meters ----
    const meterPoleMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const meterHeadMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const meterFaceMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const meterSlotMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    for (let z = -3; z > -200; z -= 6 + Math.random() * 4) {
      for (const side of [-7.8, 7.8]) {
        if (Math.random() > 0.7) continue;
        const mPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6),
          meterPoleMat
        );
        mPole.position.set(side, 0.55, z);
        scene.add(mPole);
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(0.22, 0.3, 0.15),
          meterHeadMat
        );
        head.position.set(side, 1.2, z);
        scene.add(head);
        const face = new THREE.Mesh(
          new THREE.PlaneGeometry(0.15, 0.12),
          meterFaceMat
        );
        face.position.set(side, 1.25, side > 0 ? z - 0.076 : z + 0.076);
        if (side < 0) face.rotation.y = Math.PI;
        scene.add(face);
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.02, 0.06),
          meterSlotMat
        );
        slot.position.set(side, 1.36, z);
        scene.add(slot);
      }
    }

    // ---- Fire hydrants ----
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xcc2222 });
    for (let z = 0; z > -200; z -= 30 + Math.random() * 20) {
      const side = Math.random() > 0.5 ? -7.5 : 7.5;
      const hydrant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.18, 0.7, 8),
        hydrantMat
      );
      hydrant.position.set(side, 0.55, z);
      scene.add(hydrant);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        hydrantMat
      );
      cap.position.set(side, 0.9, z);
      scene.add(cap);
    }

    // ---- Trash cans ----
    const trashMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    for (let z = -5; z > -200; z -= 25 + Math.random() * 15) {
      for (const side of [-8, 8]) {
        if (Math.random() > 0.5) continue;
        const can = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8),
          trashMat
        );
        can.position.set(side + (Math.random() - 0.5), 0.6, z);
        scene.add(can);
      }
    }

    // ============================================================
    //  PEDESTRIANS
    // ============================================================
    const pedestrians: { mesh: THREE.Group; speed: number; dir: number; baseX: number; minZ: number; maxZ: number }[] = [];
    const skinColors = [0xffcc99, 0xd4a574, 0x8d5524, 0xf1c27d, 0xe0ac69, 0xc68642];
    const shirtColors = [0xcc2233, 0x2255cc, 0x22aa55, 0xeeee33, 0xff8833, 0xaa22aa, 0xffffff, 0x222222, 0x3399cc, 0xff6688];
    const pantsColors = [0x222244, 0x333333, 0x445566, 0x554433, 0x224422];

    function createPedestrian(x: number, z: number, dir: number): THREE.Group {
      const ped = new THREE.Group();

      const skin = skinColors[Math.floor(Math.random() * skinColors.length)];
      const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
      const pants = pantsColors[Math.floor(Math.random() * pantsColors.length)];

      for (const lx of [-0.1, 0.1]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.5, 0.15),
          new THREE.MeshStandardMaterial({ color: pants })
        );
        leg.position.set(lx, 0.25, 0);
        ped.add(leg);
      }

      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.45, 0.2),
        new THREE.MeshStandardMaterial({ color: shirt })
      );
      torso.position.set(0, 0.72, 0);
      ped.add(torso);

      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 6, 6),
        new THREE.MeshStandardMaterial({ color: skin })
      );
      headMesh.position.set(0, 1.08, 0);
      ped.add(headMesh);

      const hair = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0x222222 : 0x6B3A2A })
      );
      hair.position.set(0, 1.12, 0);
      ped.add(hair);

      ped.position.set(x, 0.2, z);
      ped.rotation.y = dir > 0 ? 0 : Math.PI;
      ped.castShadow = true;
      scene.add(ped);
      return ped;
    }

    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const baseX = side * (8 + Math.random() * 2);
      const z = 10 - Math.random() * 220;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const speed = 0.01 + Math.random() * 0.025;
      const ped = createPedestrian(baseX, z, dir);
      pedestrians.push({ mesh: ped, speed, dir, baseX, minZ: z - 30, maxZ: z + 30 });
    }

    // ---- Trees ----
    for (let z = -2; z > -200; z -= 15 + Math.random() * 10) {
      for (const side of [-8.2, 8.2]) {
        if (Math.random() > 0.4) continue;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.15, 2, 6),
          new THREE.MeshStandardMaterial({ color: 0x5a3a1a })
        );
        trunk.position.set(side, 1.2, z);
        trunk.castShadow = true;
        scene.add(trunk);

        const treeCanopy = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 8, 6),
          new THREE.MeshStandardMaterial({ color: 0x2d6b2d + Math.floor(Math.random() * 0x113311) })
        );
        treeCanopy.position.set(side, 3, z);
        treeCanopy.castShadow = true;
        scene.add(treeCanopy);
      }
    }

    // ---- Biker character ----
    const biker = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();
    const bikerTexture = textureLoader.load("/sprites/timpixelpng.png");
    bikerTexture.magFilter = THREE.NearestFilter;
    bikerTexture.minFilter = THREE.NearestFilter;

    const spriteMat = new THREE.MeshStandardMaterial({
      map: bikerTexture,
      transparent: true,
      side: THREE.FrontSide,
      alphaTest: 0.5,
    });

    const spriteW = 3;
    const spriteH = 3;
    const spriteGeom = new THREE.PlaneGeometry(spriteW, spriteH);

    const bikerLayers = 50;
    const bikerSpacing = 0.004;
    const bikerInstanced = new THREE.InstancedMesh(spriteGeom, spriteMat, bikerLayers);
    bikerInstanced.castShadow = true;
    const bikerRotMatrix = new THREE.Matrix4().makeRotationY(Math.PI / 2);
    for (let i = 0; i < bikerLayers; i++) {
      const iOffset = (i - (bikerLayers - 1) / 2) * bikerSpacing;
      const m = new THREE.Matrix4().makeTranslation(iOffset, 0, 0);
      m.multiply(bikerRotMatrix);
      bikerInstanced.setMatrixAt(i, m);
    }
    biker.add(bikerInstanced);

    biker.position.set(0, 1.5, 0);
    scene.add(biker);

    // ---- Vehicles ----
    interface Vehicle {
      mesh: THREE.Group;
      speed: number;
      baseY: number;
    }
    const vehicles: Vehicle[] = [];
    const oncomingLanes = [-4.5, -1.5];
    const sameDirLanes = [1.5, 4.5];
    const buses: THREE.Group[] = [];

    const busTexture = textureLoader.load("/sprites/bus.png");
    busTexture.magFilter = THREE.NearestFilter;
    busTexture.minFilter = THREE.NearestFilter;
    const busMat = new THREE.MeshStandardMaterial({
      map: busTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });

    const carTexture = textureLoader.load("/sprites/car.png");
    carTexture.magFilter = THREE.NearestFilter;
    carTexture.minFilter = THREE.NearestFilter;
    const carMat = new THREE.MeshStandardMaterial({
      map: carTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.5,
    });

    const busGeom = new THREE.PlaneGeometry(6, 3);
    const carGeom = new THREE.PlaneGeometry(5.5, 2.5);
    const vLayers = 240;
    const vSpacing = 0.004;
    const rotY = new THREE.Matrix4().makeRotationY(Math.PI / 2);

    function createVehicle(type: "bus" | "car", direction: "oncoming" | "samedir"): Vehicle {
      const mesh = new THREE.Group();
      const isBus = type === "bus";
      const vH = isBus ? 3 : 2.5;
      const mat = isBus ? busMat : carMat;
      const geom = isBus ? busGeom : carGeom;

      const instanced = new THREE.InstancedMesh(geom, mat, vLayers);
      instanced.castShadow = true;
      for (let i = 0; i < vLayers; i++) {
        const iOffset = (i - (vLayers - 1) / 2) * vSpacing;
        const m = new THREE.Matrix4().makeTranslation(iOffset, 0, 0);
        m.multiply(rotY);
        instanced.setMatrixAt(i, m);
      }
      mesh.add(instanced);

      const lanesForDir = direction === "oncoming" ? oncomingLanes : sameDirLanes;
      const lane = lanesForDir[Math.floor(Math.random() * lanesForDir.length)];

      const speed = direction === "oncoming"
        ? 0.4 + Math.random() * 0.2
        : -(0.25 + Math.random() * 0.15);

      if (direction === "samedir") {
        mesh.rotation.y = Math.PI;
      }

      const startZ = -40 - Math.random() * 100;

      mesh.position.set(lane, vH / 2, startZ);
      return { mesh, speed, baseY: vH / 2 };
    }

    for (let i = 0; i < 8; i++) {
      const type = Math.random() > 0.4 ? "car" : "bus";
      const v = createVehicle(type, "oncoming");
      v.mesh.position.z = -30 - i * 20;
      vehicles.push(v);
      buses.push(v.mesh);
      scene.add(v.mesh);
    }

    for (let i = 0; i < 5; i++) {
      const type = Math.random() > 0.3 ? "car" : "bus";
      const v = createVehicle(type, "samedir");
      v.mesh.position.z = -20 - i * 30;
      vehicles.push(v);
      buses.push(v.mesh);
      scene.add(v.mesh);
    }

    // ---- Gold orbs ----
    interface Orb {
      mesh: THREE.Mesh;
      speed: number;
    }
    const orbs: Orb[] = [];
    const orbGeom = new THREE.SphereGeometry(0.4, 12, 12);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffa500,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });
    const orbLanes = [-4.5, -1.5, 0, 1.5, 4.5];
    const orbSpeed = 0.3;

    function spawnOrb(): Orb {
      const mesh = new THREE.Mesh(orbGeom, orbMat);
      const lane = orbLanes[Math.floor(Math.random() * orbLanes.length)];
      mesh.position.set(lane, 1.2, -50 - Math.random() * 80);
      mesh.castShadow = true;
      scene.add(mesh);
      const orb = { mesh, speed: orbSpeed + Math.random() * 0.2 };
      orbs.push(orb);
      return orb;
    }

    for (let i = 0; i < 10; i++) {
      spawnOrb();
    }

    // ---- Controls ----
    let bikerX = 0;
    const bikerSpeed = 0.15;
    const keys: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ---- Game state ----
    let score = 0;
    let gameOver = false;
    let frameId: number;

    const scoreDiv = document.createElement("div");
    scoreDiv.style.cssText =
      "position:absolute;top:20px;left:50%;transform:translateX(-50%);color:white;font-size:28px;font-family:monospace;font-weight:bold;text-shadow:2px 2px 4px rgba(0,0,0,0.7);z-index:10;";
    scoreDiv.textContent = "Score: 0";
    mount.appendChild(scoreDiv);

    const gameOverDiv = document.createElement("div");
    gameOverDiv.style.cssText =
      "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:48px;font-family:monospace;font-weight:bold;text-shadow:2px 2px 8px rgba(0,0,0,0.8);z-index:10;display:none;text-align:center;";
    mount.appendChild(gameOverDiv);

    function checkCollision(bikerPos: THREE.Vector3, bus: THREE.Group): boolean {
      const dx = Math.abs(bikerPos.x - bus.position.x);
      const dz = Math.abs(bikerPos.z - bus.position.z);
      return dx < 1.4 && dz < 3.0;
    }

    // ---- Explosion particles ----
    interface Particle {
      mesh: THREE.Mesh;
      vel: THREE.Vector3;
      life: number;
    }
    const particles: Particle[] = [];
    const particleColors = [0xff4444, 0xff8800, 0xffdd00, 0xffffff, 0xff6622, 0xffaa00];
    const particleGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    let explosionTimer = 0;

    function explode(pos: THREE.Vector3) {
      for (let i = 0; i < 40; i++) {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 });
        const p = new THREE.Mesh(particleGeom, mat);
        p.position.copy(pos);
        p.scale.setScalar(0.5 + Math.random() * 1.5);
        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.4 + 0.1,
          (Math.random() - 0.5) * 0.5
        );
        scene.add(p);
        particles.push({ mesh: p, vel, life: 1.0 });
      }
      explosionTimer = 60;
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.add(p.vel);
        p.vel.y -= 0.008;
        p.life -= 0.015;
        p.mesh.scale.multiplyScalar(0.97);
        p.mesh.rotation.x += 0.1;
        p.mesh.rotation.z += 0.08;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }
    }

    function clearParticles() {
      for (const p of particles) scene.remove(p.mesh);
      particles.length = 0;
    }

    function restart() {
      gameOver = false;
      score = 0;
      bikerX = 0;
      biker.position.set(0, 1.5, 0);
      biker.visible = true;
      clearParticles();
      explosionTimer = 0;
      gameOverDiv.style.display = "none";
      orbs.forEach((orb) => {
        const lane = orbLanes[Math.floor(Math.random() * orbLanes.length)];
        orb.mesh.position.set(lane, 1.2, -50 - Math.random() * 80);
        orb.mesh.visible = true;
      });
      vehicles.forEach((v, i) => {
        const isOncoming = v.speed > 0;
        const lanesForDir = isOncoming ? oncomingLanes : sameDirLanes;
        const lane = lanesForDir[Math.floor(Math.random() * lanesForDir.length)];
        const startZ = isOncoming ? -30 - i * 20 : -20 - i * 30;
        v.mesh.position.set(lane, v.baseY, startZ);
      });
    }

    // ---- Animate ----
    let pedTimer = 0;

    function animate() {
      frameId = requestAnimationFrame(animate);

      if (gameOver) {
        updateParticles();
        if (explosionTimer > 0) {
          explosionTimer--;
          if (explosionTimer === 0) {
            gameOverDiv.style.display = "block";
            gameOverDiv.innerHTML = `GAME OVER<br><span style="font-size:24px">Score: ${score}</span><br><button id="restartBtn" style="margin-top:16px;padding:14px 40px;font-size:22px;font-family:monospace;font-weight:bold;background:#fff;color:#111;border:none;border-radius:12px;cursor:pointer;">RESTART</button>`;
            document.getElementById("restartBtn")?.addEventListener("click", () => restart());
            document.getElementById("restartBtn")?.addEventListener("touchstart", (e) => { e.stopPropagation(); restart(); });
          }
        }
        if (keys[" "] || keys["Enter"]) restart();
        renderer.render(scene, camera);
        return;
      }

      // Move biker
      if (keys["ArrowLeft"] || keys["a"]) bikerX -= bikerSpeed;
      if (keys["ArrowRight"] || keys["d"]) bikerX += bikerSpeed;
      bikerX = Math.max(-6, Math.min(6, bikerX));
      biker.position.x = bikerX;

      // Move vehicles
      for (const v of vehicles) {
        v.mesh.position.z += v.speed;
        const isOncoming = v.speed > 0;

        if (isOncoming && v.mesh.position.z > 20) {
          const lane = oncomingLanes[Math.floor(Math.random() * oncomingLanes.length)];
          v.mesh.position.set(lane, v.baseY, -100 - Math.random() * 60);
        } else if (!isOncoming && v.mesh.position.z < -150) {
          const lane = sameDirLanes[Math.floor(Math.random() * sameDirLanes.length)];
          v.mesh.position.set(lane, v.baseY, 10 + Math.random() * 20);
        }

        if (checkCollision(biker.position, v.mesh) && !gameOver) {
          gameOver = true;
          explode(biker.position.clone().setY(1.5));
          biker.visible = false;
        }
      }

      // Animate and collect orbs
      for (const orb of orbs) {
        orb.mesh.position.z += orb.speed;
        orb.mesh.rotation.y += 0.05;
        orb.mesh.position.y = 1.2 + Math.sin(Date.now() * 0.003 + orb.mesh.position.z) * 0.3;

        if (orb.mesh.position.z > 20) {
          const lane = orbLanes[Math.floor(Math.random() * orbLanes.length)];
          orb.mesh.position.set(lane, 1.2, -60 - Math.random() * 80);
          orb.mesh.visible = true;
        }

        const dx = Math.abs(biker.position.x - orb.mesh.position.x);
        const dz = Math.abs(biker.position.z - orb.mesh.position.z);
        if (dx < 1.2 && dz < 1.5 && orb.mesh.visible) {
          orb.mesh.visible = false;
          score++;
          scoreDiv.textContent = `Score: ${score}`;
        }
      }

      // Animate pedestrians
      pedTimer += 0.016;
      for (const p of pedestrians) {
        p.mesh.position.z += p.speed * p.dir;
        p.mesh.position.y = 0.2 + Math.abs(Math.sin(pedTimer * 8 + p.baseX * 10)) * 0.04;
        if (p.mesh.position.z > p.maxZ || p.mesh.position.z < p.minZ) {
          p.dir *= -1;
          p.mesh.rotation.y = p.dir > 0 ? 0 : Math.PI;
        }
      }

      // Camera follows biker
      camera.position.x = bikerX * 0.5 + 6;
      camera.position.y = 4;
      camera.position.z = 14;
      camera.lookAt(bikerX * 0.3, 1, -20);

      renderer.render(scene, camera);
    }

    animate();

    const onResize = () => {
      camera.aspect = getWidth() / getHeight();
      camera.updateProjectionMatrix();
      renderer.setSize(getWidth(), getHeight());
    };
    window.addEventListener("resize", onResize);

    // Use ResizeObserver to handle container resizes (e.g. window dragging/resizing)
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(mount);

    // ---- Mobile controls ----
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    const btnStyle = `
      position:absolute;bottom:30px;width:90px;height:90px;
      border-radius:50%;border:3px solid rgba(255,255,255,0.6);
      background:rgba(255,255,255,0.15);backdrop-filter:blur(4px);
      color:white;font-size:36px;font-weight:bold;
      display:flex;align-items:center;justify-content:center;
      user-select:none;-webkit-user-select:none;touch-action:none;
      z-index:20;pointer-events:auto;
    `;

    const leftBtn = document.createElement("div");
    leftBtn.style.cssText = btnStyle + "left:30px;";
    leftBtn.innerHTML = "&#9664;";

    const rightBtn = document.createElement("div");
    rightBtn.style.cssText = btnStyle + "right:30px;";
    rightBtn.innerHTML = "&#9654;";

    if (isTouchDevice) {
      mount.appendChild(leftBtn);
      mount.appendChild(rightBtn);

      const handleLeft = (pressed: boolean) => { keys["ArrowLeft"] = pressed; };
      const handleRight = (pressed: boolean) => { keys["ArrowRight"] = pressed; };

      leftBtn.addEventListener("touchstart", (e) => { e.preventDefault(); handleLeft(true); }, { passive: false });
      leftBtn.addEventListener("touchend", (e) => { e.preventDefault(); handleLeft(false); }, { passive: false });
      leftBtn.addEventListener("touchcancel", () => handleLeft(false));

      rightBtn.addEventListener("touchstart", (e) => { e.preventDefault(); handleRight(true); }, { passive: false });
      rightBtn.addEventListener("touchend", (e) => { e.preventDefault(); handleRight(false); }, { passive: false });
      rightBtn.addEventListener("touchcancel", () => handleRight(false));

      renderer.domElement.addEventListener("touchstart", (e: TouchEvent) => {
        if (gameOver && explosionTimer === 0) {
          e.preventDefault();
          restart();
        }
      }, { passive: false });
    }

    renderer.domElement.style.touchAction = "none";

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(scoreDiv)) mount.removeChild(scoreDiv);
      if (mount.contains(gameOverDiv)) mount.removeChild(gameOverDiv);
      if (isTouchDevice) {
        if (mount.contains(leftBtn)) mount.removeChild(leftBtn);
        if (mount.contains(rightBtn)) mount.removeChild(rightBtn);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }} />;
}
