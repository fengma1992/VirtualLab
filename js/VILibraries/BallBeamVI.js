/**
 * Created by Fengma on 2016/10/19.
 */

'use strict';
function BallBeamVI(domElement, draw3DFlag) {

    const _this = this;
    this.name = 'BallBeamVI';
    this.cnText = '球杆模型';
    this.runningFlag = false;
    this.isStart = false;

    this.Fs = 50;
    this.markPosition = 0;  //记录标记移动位置
    this.PIDAngle = 0;
    this.PIDPosition = 0;
    this.limit = true;
    this.u1 = 0;
    this.u2 = 0;
    this.y1 = 0;
    this.y2 = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.angelOutput = [0];
    this.positionOutput = [0];
    this.outputCount = 4;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    /**
     *
     * @param angle 输入端口读取角度
     */
    this.setData = function (angle) {

        let inputAngle = Array.isArray(angle) ? angle[angle.length - 1] : angle;
        if (Number.isNaN(inputAngle)) {

            return false;
        }

        let outputPosition, Ts = 1 / _this.Fs, angleMax = 100 * Ts;
        if (_this.limit) {
            if ((inputAngle - _this.PIDAngle) > angleMax) {

                inputAngle = _this.PIDAngle + angleMax;
            }
            if ((_this.PIDAngle - inputAngle) > angleMax) {

                inputAngle = _this.PIDAngle - angleMax;
            }
            if (inputAngle > 30) {

                inputAngle = 30;
            }
            if (inputAngle < -30) {

                inputAngle = -30;
            }
        }

        _this.PIDAngle = inputAngle;//向输出端口上写数据
        outputPosition = _this.y1 + 0.5 * Ts * (inputAngle + _this.u1);
        _this.u1 = inputAngle;
        _this.y1 = outputPosition;
        inputAngle = outputPosition;
        outputPosition = parseFloat(Number(_this.y2) + Number(0.5 * Ts * (inputAngle + _this.u2))).toFixed(2);
        _this.u2 = inputAngle;
        _this.y2 = outputPosition;
        _this.PIDPosition = outputPosition;//向输出端口上写数据

        //将输出数保存在数组内
        let i = 0;
        // if (_this.index == 0) {
        //     for (i = 0; i < _this.dataLength - 1; i++) {
        //         _this.angelOutput[i] = 0;
        //         _this.positionOutput[i] = 0;
        //     }
        // }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.angelOutput[_this.index] = _this.PIDAngle;
            _this.positionOutput[_this.index] = _this.PIDPosition;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.angelOutput[i] = _this.angelOutput[i + 1];
                _this.positionOutput[i] = _this.positionOutput[i + 1];
            }
            _this.angelOutput[_this.dataLength - 1] = _this.PIDAngle;
            _this.positionOutput[_this.dataLength - 1] = _this.PIDPosition;
        }
        setPosition(_this.PIDAngle * Math.PI / 180, _this.PIDPosition);

        return [_this.PIDAngle, _this.PIDPosition];
    };

    function VIDraw() {
        let img = new Image();
        img.src = 'img/BallBeam.png';
        img.onload = function () {

            _this.ctx.drawImage(img, 0, 0, _this.canvas.width, _this.canvas.height);
        };
    }

    let camera, scene, renderer, controls, markControl, switchControl, resetControl,
        base, beam, ball, mark, offSwitch, onSwitch, resetButton, loadedFlag = false,
        position = 0;

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

        mtlLoader.load('assets/BallBeamControl/base.mtl', function (materials) {

            materials.preload();

            objLoader.setMaterials(materials);
            objLoader.load('assets/BallBeamControl/base.obj', function (a) {

                a.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {

                        child.material.side = THREE.DoubleSide;
                    }
                });
                base = a;
                mtlLoader.load('assets/BallBeamControl/beam.mtl', function (materials) {

                    materials.preload();

                    objLoader.setMaterials(materials);
                    objLoader.load('assets/BallBeamControl/beam.obj', function (b) {

                        b.traverse(function (child) {
                            if (child instanceof THREE.Mesh) {

                                child.material.side = THREE.DoubleSide;
                            }
                        });
                        beam = b;
                        mtlLoader.load('assets/BallBeamControl/ball.mtl', function (materials) {

                            materials.preload();

                            objLoader.setMaterials(materials);
                            objLoader.load('assets/BallBeamControl/ball.obj', function (c) {
                                c.traverse(function (child) {
                                    if (child instanceof THREE.Mesh) {

                                        child.material.side = THREE.DoubleSide;
                                    }
                                });
                                ball = c;
                                mtlLoader.load('assets/BallBeamControl/mark.mtl', function (materials) {

                                    materials.preload();

                                    objLoader.setMaterials(materials);
                                    objLoader.load('assets/BallBeamControl/mark.obj', function (d) {
                                        d.traverse(function (child) {
                                            if (child instanceof THREE.Mesh) {

                                                child.material.side = THREE.DoubleSide;
                                            }
                                        });
                                        mark = d;
                                        mtlLoader.load('assets/BallBeamControl/offSwitch.mtl', function (materials) {

                                            materials.preload();

                                            objLoader.setMaterials(materials);
                                            objLoader.load('assets/BallBeamControl/offSwitch.obj', function (e) {
                                                e.traverse(function (child) {
                                                    if (child instanceof THREE.Mesh) {

                                                        child.material.side = THREE.DoubleSide;
                                                    }
                                                });
                                                offSwitch = e;
                                                mtlLoader.load('assets/BallBeamControl/onSwitch.mtl', function (materials) {

                                                    materials.preload();

                                                    objLoader.setMaterials(materials);
                                                    objLoader.load('assets/BallBeamControl/onSwitch.obj', function (f) {
                                                        f.traverse(function (child) {
                                                            if (child instanceof THREE.Mesh) {

                                                                child.material.side = THREE.DoubleSide;
                                                            }
                                                        });
                                                        onSwitch = f;
                                                        mtlLoader.load('assets/BallBeamControl/resetButton.mtl', function (materials) {

                                                            materials.preload();

                                                            objLoader.setMaterials(materials);
                                                            objLoader.load('assets/BallBeamControl/resetButton.obj', function (g) {
                                                                g.traverse(function (child) {
                                                                    if (child instanceof THREE.Mesh) {

                                                                        child.material.side = THREE.DoubleSide;
                                                                    }
                                                                });
                                                                resetButton = g;
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
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * 三维绘图
     * @param domElement HTML CANVAS
     * @constructor
     */
    function BallBeamDraw() {
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

        //标记拖动控制
        markControl = new ObjectControls(camera, renderer.domElement);
        markControl.map = plane;
        markControl.offsetUse = true;

        markControl.attachEvent('mouseOver', function () {

            renderer.domElement.style.cursor = 'pointer';
        });

        markControl.attachEvent('mouseOut', function () {

            renderer.domElement.style.cursor = 'auto';
        });

        markControl.attachEvent('dragAndDrop', onBallBeamDrag);

        markControl.attachEvent('mouseUp', function () {

            controls.enabled = true;
            renderer.domElement.style.cursor = 'auto';
        });

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

            }

            else {

                _this.isStart = false;

                scene.remove(onSwitch);
                switchControl.detach(onSwitch);
                scene.add(offSwitch);
                switchControl.attach(offSwitch);
            }

        });

        //重置开关
        resetControl = new ObjectControls(camera, renderer.domElement);
        resetControl.map = plane;
        resetControl.offsetUse = true;

        resetControl.attachEvent('mouseOver', function () {

            renderer.domElement.style.cursor = 'pointer';
        });

        resetControl.attachEvent('mouseOut', function () {

            renderer.domElement.style.cursor = 'auto';
        });

        resetControl.attachEvent('onclick', function () {

            _this.isStart = false;
            scene.remove(onSwitch);
            switchControl.detach(onSwitch);
            scene.add(offSwitch);
            switchControl.attach(offSwitch);
            position = 0;
            _this.reset();

        });

        scene.add(base);
        scene.add(beam);
        scene.add(ball);
        scene.add(mark);
        scene.add(offSwitch);
        scene.add(resetButton);
        markControl.attach(mark);
        switchControl.attach(offSwitch);
        resetControl.attach(resetButton);

        ballBeamAnimate();

        // window.addEventListener('resize', function () {
        //
        //     camera.aspect = domElement.clientWidth / domElement.clientHeight;
        //     camera.updateProjectionMatrix();
        //     renderer.setSize(domElement.clientWidth, domElement.clientHeight);
        // });
    }

    function onBallBeamDrag() {

        controls.enabled = false;
        renderer.domElement.style.cursor = 'pointer';
        this.focused.position.y = this.previous.y;  //lock y direction
        position = this.focused.position.x;
        if (position < -120) {

            this.focused.position.x = -120;
        }
        else if (position > 120) {

            this.focused.position.x = 120;
        }

        position = this.focused.position.x;
        _this.markPosition = parseFloat(position).toFixed(2);
    }

    function ballBeamAnimate() {

        window.requestAnimationFrame(ballBeamAnimate);
        markControl.update();
        controls.update();
        renderer.render(scene, camera);

    }

    function setPosition(ang, pos) {
        let angle = -ang;//角度为逆时针旋转
        beam.rotation.z = angle;
        ball.rotation.z = angle;
        mark.rotation.z = angle;
        ball.position.y = pos * Math.sin(angle);
        ball.position.x = pos * Math.cos(angle);
        mark.position.y = position * Math.sin(angle);
        mark.position.x = position * Math.cos(angle);
    }

    this.draw = function () {

        if (draw3DFlag) {

            let timer = window.setInterval(function () {
                if (loadedFlag) {

                    new BallBeamDraw();
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

    this.reset = function () {

        _this.PIDAngle = 0;
        _this.PIDPosition = 0;
        _this.angelOutput = [0];
        _this.positionOutput = [0];
        _this.limit = true;
        _this.u1 = 0;
        _this.u2 = 0;
        _this.y1 = 0;
        _this.y2 = 0;
        _this.index = 0;
        setPosition(0, 0);
    };
}
