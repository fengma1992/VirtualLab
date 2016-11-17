/**
 * Created by Fengma on 2016/11/7.
 */

'use strict';
function RotorExperimentalRigVI(domElement, draw3DFlag) {

    const _this = this;
    this.name = 'RotorExperimentalRigVI';
    this.cnText = '转子实验台';
    this.runningFlag = false;
    this.isStart = false;

    this.signalType = 1;
    this.rotateSpeed = 0;
    this.dataLength = 2048;
    this.index = 0;
    this.rotateFrequency = 0;  //旋转频率
    this.signalOutput = [0];
    this.frequencyOutput = [0];
    this.orbitXOutput = [0];
    this.orbitYOutput = [0];
    this.outputCount = 5;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    /**
     *设置转速
     * @param rotateSpeed 输入端口读取转速
     */
    this.setData = function (rotateSpeed) {

        _this.rotateSpeed = Array.isArray(rotateSpeed) ? rotateSpeed[rotateSpeed.length - 1] : rotateSpeed;
        if (Number.isNaN(_this.rotateSpeed)) {

            return false;
        }
        _this.rotateFrequency = _this.rotateSpeed / 60;
    };

    this.reset = function () {

        _this.signalType = 1;
        _this.rotateSpeed = 0;
        _this.index = 0;
        _this.rotateFrequency = 0;  //旋转频率
        _this.signalOutput = [0];
        _this.frequencyOutput = [0];
        _this.orbitXOutput = [0];
        _this.orbitYOutput = [0];
    };

    function VIDraw() {
        let img = new Image();
        img.src = 'img/RotorExperimentalRig.png';
        img.onload = function () {

            _this.ctx.drawImage(img, 0, 0, _this.canvas.width, _this.canvas.height);
        };
    }

    let camera, scene, renderer, controls, base, rotor, offSwitch, onSwitch, switchControl, loadedFlag = false,
        timer1, timer2, rotateAngle = 0, phase = 0, sampleFrequency = 8192, dt = 1 / sampleFrequency;

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    if (draw3DFlag) {

        let loadingImg = document.createElement('img');
        loadingImg.src = 'img/loading.gif';
        loadingImg.style.width = '64px';
        loadingImg.style.height = '64px';
        loadingImg.style.position = 'absolute';
        loadingImg.style.top = domElement.offsetTop + domElement.offsetHeight / 2 - 32 + 'px';
        loadingImg.style.left = domElement.offsetLeft + domElement.offsetWidth / 2 - 32 + 'px';
        loadingImg.style.zIndex = '1001';
        domElement.parentNode.appendChild(loadingImg);

        let mtlLoader = new THREE.MTLLoader();
        let objLoader = new THREE.OBJLoader();

        mtlLoader.load('assets/RotorExperimentalRig/base.mtl', function (materials) {

            materials.preload();

            objLoader.setMaterials(materials);
            objLoader.load('assets/RotorExperimentalRig/base.obj', function (a) {
                a.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {

                        child.material.side = THREE.DoubleSide;
                    }
                });
                base = a;
                mtlLoader.load('assets/RotorExperimentalRig/rotor.mtl', function (materials) {

                    materials.preload();

                    objLoader.setMaterials(materials);
                    objLoader.load('assets/RotorExperimentalRig/rotor.obj', function (b) {
                        b.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {

                                child.material.side = THREE.DoubleSide;
                            }
                        });
                        rotor = b;
                        mtlLoader.load('assets/RotorExperimentalRig/offSwitch.mtl', function (materials) {

                            materials.preload();

                            objLoader.setMaterials(materials);
                            objLoader.load('assets/RotorExperimentalRig/offSwitch.obj', function (c) {
                                c.traverse(function (child) {
                                    if (child instanceof THREE.Mesh) {

                                        child.material.side = THREE.DoubleSide;
                                    }
                                });
                                offSwitch = c;
                                mtlLoader.load('assets/RotorExperimentalRig/onSwitch.mtl', function (materials) {

                                    materials.preload();

                                    objLoader.setMaterials(materials);
                                    objLoader.load('assets/RotorExperimentalRig/onSwitch.obj', function (d) {
                                        d.traverse(function (child) {
                                            if (child instanceof THREE.Mesh) {

                                                child.material.side = THREE.DoubleSide;
                                            }
                                        });
                                        onSwitch = d;

                                        loadedFlag = true;
                                        loadingImg.style.display = 'none';
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    function rotorAnimate() {

        window.requestAnimationFrame(rotorAnimate);
        switchControl.update();
        controls.update();
        renderer.render(scene, camera);

    }

    function generateData() {

        let i;
        for (i = 0; i < _this.dataLength; i++) {

            _this.orbitXOutput[i] = 7.5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * phase / 360) +
                4 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * phase / 360) + 2 * Math.random();
        }
        for (i = 0; i < _this.dataLength; i++) {

            _this.orbitYOutput[i] = 7.5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * (phase + 90) / 360) +
                4 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * (phase + 90) / 360) + 2 * Math.random();
        }
        if (_this.signalType == 1) {//转速信号    正弦波

            for (i = 0; i < _this.dataLength; i++) {

                _this.signalOutput[i] = 5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * phase / 360);
            }
        } else if (_this.signalType == 2) {//加速度信号

            for (i = 0; i < _this.dataLength; i++) {

                _this.signalOutput[i] = 5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * phase / 360) +
                    6 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * phase / 360) + 2 * Math.random();
            }
        } else if (_this.signalType == 3) {//位移X信号

            for (i = 0; i < _this.dataLength; i++) {

                _this.signalOutput[i] = _this.orbitXOutput[i];
            }
        } else if (_this.signalType == 4) {//位移Y信号

            for (i = 0; i < _this.dataLength; i++) {

                _this.signalOutput[i] = _this.orbitYOutput[i];
            }
        }
        _this.frequencyOutput = fft(1, 12, _this.signalOutput.splice(0, 0, '')); //需SignalProcessLib
    }

    /**
     * 三维绘图
     * @constructor
     */
    function RotorExperimentalRigDraw() {

        renderer = new THREE.WebGLRenderer({
            canvas: domElement,
            antialias: true
        });
        renderer.setClearColor(0x6495ED);
        renderer.setSize(domElement.clientWidth, domElement.clientHeight);

        camera = new THREE.PerspectiveCamera(30, domElement.clientWidth / domElement.clientHeight, 1, 100000);
        camera.position.z = 400;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.rotateSpeed = 0.8;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.2;
        controls.enableDamping = true;

        scene = new THREE.Scene();

        let light = new THREE.AmbientLight(0x555555);
        scene.add(light);
        let light1 = new THREE.DirectionalLight(0xffffff, 1);
        light1.position.set(4000, 4000, 4000);
        scene.add(light1);
        let light2 = new THREE.DirectionalLight(0xffffff, 1);
        light2.position.set(-4000, 4000, -4000);
        scene.add(light2);

        //use as a reference plane for ObjectControl
        let plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 400));

        //开关控制
        switchControl = new ObjectControls(camera, renderer.domElement);
        switchControl.map = plane;
        switchControl.offsetUse = true;

        switchControl.attachEvent('mouseOver', function () {

            renderer.domElement.style.cursor = 'pointer';
        });

        switchControl.attachEvent('mouseOut', function () {

            renderer.domElement.style.cursor = 'auto';
        });

        switchControl.attachEvent('onclick', function () {

            if (!_this.isStart) {

                _this.isStart = true;

                scene.remove(offSwitch);
                switchControl.detach(offSwitch);
                scene.add(onSwitch);
                switchControl.attach(onSwitch);

                timer1 = window.setInterval(function () {
                    phase += 36;
                    generateData();
                }, 100);
                timer2 = window.setInterval(function () {
                    rotor.rotation.x += 2 * Math.PI * _this.rotateFrequency * 60 / 100;
                }, 10);

            }

            else {

                _this.isStart = false;

                scene.remove(onSwitch);
                switchControl.detach(onSwitch);
                scene.add(offSwitch);
                switchControl.attach(offSwitch);
                window.clearInterval(timer1);
                window.clearInterval(timer2);
            }

        });

        scene.add(base);
        scene.add(rotor);
        scene.add(offSwitch);
        switchControl.attach(offSwitch);

        rotorAnimate();

        // window.addEventListener('resize', function () {
        //
        //     camera.aspect = domElement.clientWidth / domElement.clientHeight;
        //     camera.updateProjectionMatrix();
        //     renderer.setSize(domElement.clientWidth, domElement.clientHeight);
        // });
    }

    this.draw = function () {

        if (draw3DFlag) {

            let timer = window.setInterval(function () {
                if (loadedFlag) {

                    new RotorExperimentalRigDraw();
                    window.clearInterval(timer);
                }
            }, 100);
        }
        else {

            _this.canvas = domElement;
            _this.ctx = domElement.getContext('2d');
            VIDraw();
        }
    };
    this.draw();
}
