/**
 * Created by Fengma on 2016/11/7.
 */

'use strict';
function RotorExperimentalRigVI(domElement, drawFlag) {

    var _this = this;
    if (drawFlag) {
        RotorExperimentalRigDraw(domElement);
    }
    else {

        _this.canvas = domElement;
        _this.ctx = domElement.getContext('2d');
        VIDraw();
    }
    this.name = 'RotorExperimentalRigVI';
    this.cnText = '转子实验台';
    this.runningFlag = false;
    this.isStart = false;

    this.signalType = 1;
    this.rotateFrequency = 50;  //旋转频率
    this.dataLength = 5120;
    this.index = 0;
    this.signalOutput = [];
    this.frequencyOutput = [];
    this.orbitOutput = [];
    this.outputCount = 3;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    /**
     *设置转速
     * @param rotateSpeed 输入端口读取转速
     */
    this.setData = function (rotateSpeed) {

        rotateSpeed = isArray(rotateSpeed) ? rotateSpeed[rotateSpeed.length - 1] : rotateSpeed;
        if (isNaN(rotateSpeed)) {

            return false;
        }
        _this.rotateFrequency = rotateSpeed / 60;
    };

    this.reset = function () {

    };

    function VIDraw() {
        var img = new Image();
        img.src = 'img/RotorExperimentalRig.png';
        img.onload = function () {

            _this.ctx.drawImage(img, 0, 0, _this.canvas.width, _this.canvas.height);
        };
    }

    var camera, scene, renderer, controls, rotor, offSwitch, onSwitch, switchControl,
        timer1, timer2, rotateAngle = 0, phase = 0, sampleFrequency = 5120, dt = 1 / sampleFrequency,
        orbitY = [], orbitX = [];

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    function rotorAnimate() {

        window.requestAnimationFrame(rotorAnimate);
        switchControl.update();
        controls.update();
        renderer.render(scene, camera);

    }

    function generateData() {

        var i;
        for (i = 0; i < _this.dataLength; i++) {

            orbitX[i] = 7.5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * phase / 360) +
                4 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * phase / 360) + 2 * Math.random();
        }
        for (i = 0; i < _this.dataLength; i++) {

            orbitY[i] = 7.5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * (phase + 90) / 360) +
                4 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * (phase + 90) / 360) + 2 * Math.random();
        }
        _this.orbitOutput[0] = orbitX;
        _this.orbitOutput[1] = orbitY;
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

                _this.signalOutput[i] = orbitX[i];
            }
        } else if (_this.signalType == 4) {//位移Y信号

            for (i = 0; i < _this.dataLength; i++) {

                _this.signalOutput[i] = orbitY[i];
            }
        }
        _this.frequencyOutput = fft(1, 10, _this.signalOutput); //需SignalProcessLib
    }

    /**
     * 三维绘图
     * @param domElement HTML CANVAS
     * @param loadingDiv 三维加载时遮罩
     * @constructor
     */
    function RotorExperimentalRigDraw(domElement) {
        var loadingImg = document.createElement('img');
        loadingImg.src = 'img/loading.gif';
        loadingImg.style.width = '64px';
        loadingImg.style.height = '64px';
        loadingImg.style.position = 'absolute';
        loadingImg.style.top = domElement.offsetTop + domElement.offsetHeight / 2 - 32 + 'px';
        loadingImg.style.left = domElement.offsetLeft + domElement.offsetWidth / 2 - 32 + 'px';
        loadingImg.style.zIndex = '1001';
        domElement.parentNode.appendChild(loadingImg);

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

        var light = new THREE.AmbientLight(0x555555);
        scene.add(light);
        var light1 = new THREE.DirectionalLight(0xffffff, 1);
        light1.position.set(4000, 4000, 4000);
        scene.add(light1);
        var light2 = new THREE.DirectionalLight(0xffffff, 1);
        light2.position.set(-4000, 4000, -4000);
        scene.add(light2);

        //use as a reference plane for ObjectControl
        var plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(1000, 400));

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
                var pivot = new THREE.Object3D();
                pivot.add(rotor);
                scene.add(pivot);
                timer2 = window.setInterval(function () {
                    rotateAngle = 2 * Math.PI * _this.rotateFrequency * 60 / 10;
                    pivot.rotation.x += 0.01;
                }, 100);

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

        var mtlLoader = new THREE.MTLLoader();
        var objLoader = new THREE.OBJLoader();

        mtlLoader.load('assets/RotorExperimentalRig/base.mtl', function (materials) {

            materials.preload();

            objLoader.setMaterials(materials);
            objLoader.load('assets/RotorExperimentalRig/base.obj', function (base) {
                base.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {

                        child.material.side = THREE.DoubleSide;
                    }
                });
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

                                        loadingImg.style.display = 'none';
                                        scene.add(base);
                                        scene.add(rotor);
                                        scene.add(offSwitch);
                                        switchControl.attach(offSwitch);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        rotorAnimate();

        // window.addEventListener('resize', function () {
        //
        //     camera.aspect = domElement.clientWidth / domElement.clientHeight;
        //     camera.updateProjectionMatrix();
        //     renderer.setSize(domElement.clientWidth, domElement.clientHeight);
        // });
    }
}
