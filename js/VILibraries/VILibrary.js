/**
 * Created by Fengma on 2016/11/10.
 */

'use strict';
var VILibrary = {REVISION: '1'};

VILibrary.isArray = function (obj) {

    return Object.prototype.toString.call(obj) === '[object Array]';
};

VILibrary.AddVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'AddVI';
    this.cnText = '加法器';
    this.runningFlag = false;
    this.dataSetCount = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.originalInput = 0;
    this.latestInput = 0;
    this.singleOutput = 0;
    this.output = [0];
    this.outputCount = 2;
    this.inputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];


    this.setData = function (latestInput) {

        _this.latestInput = VILibrary.isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
        if (isNaN(_this.latestInput)) {

            return false;
        }
        _this.singleOutput = parseFloat(_this.originalInput - _this.latestInput).toFixed(2);

        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {

            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {

            for (i = 0; i < _this.dataLength - 1; i++) {

                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;
    };

    this.setOriginalData = function (originalInput) {

        originalInput = VILibrary.isArray(originalInput) ? originalInput[originalInput.length - 1] : originalInput;
        if (isNaN(originalInput)) {

            return false;
        }
        _this.originalInput = originalInput;
        return _this.originalInput;
    };

    this.reset = function () {

        _this.originalInput = 0;
        _this.latestInput = 0;
        _this.singleOutput = 0;
        _this.index = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('加法器', _this.container.width / 2 - 18, _this.container.height / 2 + 6);
    };

    this.draw();

};

VILibrary.BallBeamVI = function (domElement, draw3DFlag) {

    var _this = this;
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

        var inputAngle = VILibrary.isArray(angle) ? angle[angle.length - 1] : angle;
        if (isNaN(inputAngle)) {

            return false;
        }

        var outputPosition, Ts = 1 / _this.Fs, angleMax = 100 * Ts;
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
        var i = 0;
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
        var img = new Image();
        img.src = 'img/BallBeam.png';
        img.onload = function () {

            _this.ctx.drawImage(img, 0, 0, _this.canvas.width, _this.canvas.height);
        };
    }

    var camera, scene, renderer, controls, markControl, switchControl, resetControl,
        base, beam, ball, mark, offSwitch, onSwitch, resetButton, loadedFlag = false,
        position = 0;

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;


    if (draw3DFlag) {


        var loadingImg = document.createElement('img');
        loadingImg.src = 'img/loading.gif';
        loadingImg.style.width = '64px';
        loadingImg.style.height = '64px';
        loadingImg.style.position = 'absolute';
        loadingImg.style.top = domElement.offsetTop + domElement.offsetHeight / 2 - 32 + 'px';
        loadingImg.style.left = domElement.offsetLeft + domElement.offsetWidth / 2 - 32 + 'px';
        loadingImg.style.zIndex = '1001';
        domElement.parentNode.appendChild(loadingImg);

        var mtlLoader = new THREE.MTLLoader();
        var objLoader = new THREE.OBJLoader();

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
        var angle = -ang;//角度为逆时针旋转
        beam.rotation.z = angle;
        ball.rotation.z = angle;
        mark.rotation.z = angle;
        ball.position.y = pos * Math.sin(angle);
        ball.position.x = pos * Math.cos(angle);
        mark.position.y = position * Math.sin(angle);
        mark.position.x = position * Math.cos(angle);
    }

    this.reset = function () {

        _this.PIDAngle = 0;
        _this.PIDPosition = 0;
        this.angelOutput = [0];
        this.positionOutput = [0];
        _this.limit = true;
        _this.u1 = 0;
        _this.u2 = 0;
        _this.y1 = 0;
        _this.y2 = 0;
        _this.index = 0;
        setPosition(0, 0);
    };

    this.draw = function () {

        if (draw3DFlag) {

            var timer = window.setInterval(function () {
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

};

VILibrary.ButtonVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'ButtonVI';
    this.cnText = '开关';
    this.runningFlag = false;
    this.fillStyle = 'silver';

    //虚拟仪器中相连接的控件VI
    this.source = [];

    this.setData = function (data) {
    };

    this.reset = function () {

        _this.index = 0;
        _this.output = [0];
    };

    this.draw = function () {

        _this.ctx.font = "bold 14px Microsoft YaHei";
        _this.ctx.fillStyle = _this.fillStyle;
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText(_this.cnText, _this.container.width / 2 - 11, _this.container.height / 2 + 6);
    };

    this.draw();

    this.container.addEventListener('click', function () {

        if (_this.source != false) {

            if (!_this.runningFlag) {

                _this.runningFlag = true;
                _this.fillStyle = 'orange';
                _this.cnText = '停止';
            } else {

                _this.runningFlag = false;
                _this.fillStyle = 'silver';
                _this.cnText = '开始';
            }
            _this.draw();
        }
    }, false);
};

VILibrary.DCOutputVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'DCOutputVI';
    this.cnText = '直流输出';
    this.runningFlag = false;

    this.dataLength = 1024;
    this.index = 0;
    this.singleOutput = 100;//输出初值
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.target = [];

    /**
     * 将输出数保存在数组内
     * @param data singleOutput
     */
    this.setData = function (data) {

        var temp = VILibrary.isArray(data) ? data[data.length - 1] : data;
        if (isNaN(temp)) {

            return false;
        }

        _this.singleOutput = temp;

        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {

            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {

            for (i = 0; i < _this.dataLength - 1; i++) {

                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }
    };

    this.reset = function () {

        _this.index = 0;
        _this.output = [0];
    };

    this.draw = function () {

        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('直流', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('输出', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.DifferentiationResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'DifferentiationResponseVI';
    this.cnText = '微分响应';
    this.runningFlag = false;

    this.signalType = 3;
    this.k3 = 0.0025;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        _this.singleOutput = _this.k3 * (_this.input - _this.lastInput) * _this.Fs;
        _this.lastInput = _this.input;

        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }


        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('微分', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();

};

VILibrary.InertiaResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'InertiaResponseVI';
    this.cnText = '惯性响应';
    this.runningFlag = false;

    this.signalType = 6;
    this.k1 = 0.025;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v, E;

        //一阶 1/(TS+1)
        E = Math.exp(-1 / (_this.k1 * _this.Fs));
        v = E * _this.temp1 + (1.0 - E) * _this.input;
        _this.temp1 = v;
        _this.singleOutput = v;//输出

        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }


        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('惯性', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();

};

VILibrary.IntegrationResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'IntegrationResponseVI';
    this.cnText = '积分响应';
    this.runningFlag = false;

    this.signalType = 2;
    this.k2 = 5;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v2, v21;

        v21 = _this.temp1 + 0.5 * (_this.input + _this.lastInput) / _this.Fs;
        _this.temp1 = v21;
        v2 = _this.k2 * v21;


        _this.singleOutput = v2;
        _this.lastInput = _this.input;


        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('积分', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.KnobVI = function (domElement) {

    var _this = this;

    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'KnobVI';
    this.cnText = '旋钮';
    this.runningFlag = false;

    this.minValue = 0;
    this.maxValue = 100;
    this.defaultValue = 100;
    this.ratio = (this.maxValue - this.minValue) / (Math.PI * 1.5);
    this.singleOutput = this.defaultValue;
    this.radian = (this.defaultValue - this.minValue) / this.ratio;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.target = [];

    var spinnerFlag = false;
    var startX, startY, stopX, stopY;
    var roundCount = 0;
    var knob_Base = new Image(), knob_Spinner = new Image();
    knob_Base.src = "img/knob_Base.png";
    knob_Spinner.src = "img/knob_Spinner.png";

    knob_Base.onload = knob_Spinner.onload = function () {
        _this.draw();
    };
    knob_Base.onerror = knob_Spinner.onerror = function () {
        console.log('error');
    };

    /**
     *设置旋钮初始参数
     * @param minValue  最小值
     * @param maxValue  最大值
     * @param startValue  初值
     */
    this.setDataRange = function (minValue, maxValue, startValue) {

        _this.minValue = isNaN(minValue) ? 0 : minValue;
        _this.maxValue = isNaN(maxValue) ? 1 : maxValue;
        _this.defaultValue = isNaN(startValue) ? 0 : startValue;
        _this.ratio = (_this.maxValue - _this.minValue) / (Math.PI * 1.5);
        this.setData(_this.defaultValue);
        this.radian = (_this.defaultValue - _this.minValue) / _this.ratio;

        _this.draw();
    };

    this.setData = function (data) {

        if (isNaN(data)) {

            return false;
        }

        _this.singleOutput = data;

        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {

            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {

                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }
    };

    this.reset = function () {

        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {

        var xPos = _this.container.width / 2;
        var yPos = _this.container.height / 2;
        _this.ctx.clearRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.drawImage(knob_Base, 0, 0, _this.container.width, _this.container.height);
        _this.ctx.save();   //保存之前位置
        _this.ctx.translate(xPos, yPos);
        _this.ctx.rotate(_this.radian - 135 / 180 * Math.PI);  //旋转, 初始位置为左下角
        _this.ctx.translate(-xPos, -yPos);
        _this.ctx.drawImage(knob_Spinner, 0, 0, _this.container.width, _this.container.height);
        _this.ctx.restore();  //恢复之前位置
        _this.ctx.beginPath();
        _this.ctx.font = "normal 14px Calibri";
        _this.ctx.fillText(_this.minValue.toString(), 0, _this.container.height);
        _this.ctx.fillText(_this.maxValue.toString(), _this.container.width - 7 * _this.maxValue.toString().length, _this.container.height); //字体大小为14
        _this.ctx.closePath();
    };

    var _mouseOverFlag = false;
    var _mouseOutFlag = false;
    var _dragAndDropFlag = false;
    var _mouseUpFlag = false;
    var _onclickFlag = false;
    var _mouseMoveFlag = false;

    this.dragAndDrop = function () {
    };// this.container.style.cursor = 'move';
    this.mouseOver = function () {
    }; // this.container.style.cursor = 'pointer';
    this.mouseOut = function () {
    }; // this.container.style.cursor = 'auto';
    this.mouseUp = function () {
    }; // this.container.style.cursor = 'auto';
    this.mouseMove = function () {
    };
    this.onclick = function () {
    };

    this.attachEvent = function (event, handler) {

        switch (event) {
            case 'mouseOver':
                this.mouseOver = handler;
                _mouseOverFlag = true;
                break;
            case 'mouseOut':
                this.mouseOut = handler;
                _mouseOutFlag = true;
                break;
            case 'dragAndDrop':
                this.dragAndDrop = handler;
                _dragAndDropFlag = true;
                break;
            case 'mouseUp':
                this.mouseUp = handler;
                _mouseUpFlag = true;
                break;
            case 'onclick':
                this.onclick = handler;
                _onclickFlag = true;
                break;
            case 'mouseMove':
                this.mouseMove = handler;
                _mouseMoveFlag = true;
                break;
                break;
        }
    };

    this.detachEvent = function (event) {

        switch (event) {
            case 'mouseOver':
                _mouseOverFlag = false;
                break;
            case 'mouseOut':
                _mouseOutFlag = false;
                break;
            case 'dragAndDrop':
                _dragAndDropFlag = false;
                break;
            case 'mouseUp':
                _mouseUpFlag = false;
                break;
            case 'onclick':
                _onclickFlag = false;
                break;
            case 'mouseMove':
                _mouseMoveFlag = false;
                break;
                break;
        }

    };

    function onMouseDown(event) {

        var tempData = rotateAxis(event.offsetX - _this.container.width / 2, -(event.offsetY - _this.container.height / 2), 135);
        startX = tempData[0];
        startY = tempData[1];
        if ((startX * startX + startY * startY) <= _this.container.width / 2 * _this.container.width / 2 * 0.5) {

            spinnerFlag = true;
        }

    }

    function onMouseMove(event) {

        var tempData = rotateAxis(event.offsetX - _this.container.width / 2, -(event.offsetY - _this.container.height / 2), 135);
        stopX = tempData[0];
        stopY = tempData[1];
        if ((stopX * stopX + stopY * stopY) <= _this.container.width / 2 * _this.container.width / 2 * 0.5 && !spinnerFlag)
            _this.container.style.cursor = 'pointer';
        else if (!spinnerFlag)
            _this.container.style.cursor = 'auto';
        if (spinnerFlag) {

            if (startY > 0 && stopY > 0) {
                if (startX < 0 && stopX >= 0) {
                    roundCount++;
                }
                else if (startX > 0 && stopX <= 0) {
                    roundCount--;
                }
            }

            _this.radian = calculateRadian(0, 0, stopX, stopY) + Math.PI * 2 * roundCount;
            if (_this.radian < 0) {
                _this.radian = 0;
            }
            else if (_this.radian > 270 / 360 * 2 * Math.PI) {
                _this.radian = 270 / 180 * Math.PI;
            }
            _this.setData(_this.radian * _this.ratio + parseFloat(_this.minValue));
            _this.draw();
            startX = stopX;
            startY = stopY;

            if (_mouseMoveFlag) {

                _this.mouseMove();
            }
        }
    }

    function onMouseUp(event) {

        spinnerFlag = false;
        roundCount = 0;

        if (_mouseUpFlag) {

            _this.mouseUp();
        }
    }

    function calculateRadian(x1, y1, x2, y2) {
        // 直角的边长
        var x = x2 - x1;
        var y = y2 - y1;
        // 斜边长
        var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        // 余弦
        var cos = y / z;
        // 弧度
        var radian;
        if (x >= 0)
            radian = Math.acos(cos);
        else
            radian = Math.PI * 2 - Math.acos(cos);
        return radian;
    }

    /**
     * 坐标系转换
     * @param x
     * @param y
     * @param angle
     * @returns {[x1, y1]}
     */
    function rotateAxis(x, y, angle) {
        var radian = angle / 180 * Math.PI;
        return [Math.sin(radian) * y + Math.cos(radian) * x, Math.cos(radian) * y - Math.sin(radian) * x];
    }

    this.container.addEventListener('mousemove', onMouseMove, false);
    this.container.addEventListener('mousedown', onMouseDown, false);
    this.container.addEventListener('mouseup', onMouseUp, false);
};

VILibrary.OrbitWaveVI = function (domElement) {

    var _this = this;
    this.canvas = domElement;
    this.ctx = this.canvas.getContext("2d");
    this.name = 'OrbitWaveVI';
    this.cnText = '轨迹控件';
    this.runningFlag = false;

    this.width = this.canvas.width; //对象宽度//
    this.height = this.canvas.height; //对象高度//
    //坐标单位//
    this.strLabelX = 'X';
    this.strLabelY = 'Y';

    //坐标数值//
    this.MaxVal = 20;
    this.MinVal = -20;
    this.autoZoom = true;

    //网格行列数//
    this.nRow = 10;
    this.nCol = 10;
    this.pointNum = 0;
    this.borderWidth = 5;
    this.drawRulerFlag = true;

    //网格矩形四周边距 TOP RIGHT BOTTOM LEFT//
    this.offsetT = 5 + this.borderWidth;
    this.offsetR = 5 + this.borderWidth;

    this.offsetB = 5 + this.borderWidth;
    this.offsetL = 5 + this.borderWidth;
    if ((_this.height >= 200) && (_this.width >= 200)) {

        _this.offsetB = 25 + _this.borderWidth;
        _this.offsetL = 38 + _this.borderWidth;
    }
    this.waveWidth = this.width - this.offsetL - this.offsetR;
    this.waveHeight = this.height - this.offsetT - this.offsetB;

    //颜色选型//
    this.bgColor = "RGB(249, 250, 249)";
    this.screenColor = "RGB(61, 132, 185)";
    this.gridColor = "RGB(200, 200, 200)";
    this.fontColor = "RGB(0, 0, 0)";
    this.signalColor = "RGB(255, 255, 0)";
    this.rulerColor = "RGB(255, 255, 255)";

    //缓冲数组

    this.bufferValX = [];
    this.bufferValY = [];
    this.curPointX = this.offsetL;
    this.curPointY = this.offsetT;

    //虚拟仪器中相连接的控件VI
    this.source = [];

    this.draw = function () {

        _this.drawBackground();
        _this.drawWave();
        if (_this.drawRulerFlag) {

            _this.drawRuler();
        }
    };

    this.drawWave = function () {

        var ratioX = _this.waveWidth / (_this.MaxVal - _this.MinVal);
        var ratioY = _this.waveHeight / (_this.MaxVal - _this.MinVal);
        var pointX = [];
        var pointY = [];

        var i;
        for (i = 0; i < _this.pointNum; i++) {

            pointX[i] = _this.offsetL + (_this.bufferValX[i] - _this.MinVal) * ratioX;
            pointY[i] = _this.offsetT + (_this.MaxVal - _this.bufferValY[i]) * ratioY;
            if (pointY[i] < _this.offsetT) {

                pointY[i] = _this.offsetT;
            }
            if (pointY[i] > (_this.offsetT + _this.waveHeight)) {

                pointY[i] = _this.offsetT + _this.waveHeight;
            }
        }
        //绘制波形曲线
        _this.ctx.beginPath();
        _this.ctx.lineWidth = 2;
        _this.ctx.lineCap = "round";
        _this.ctx.strokeStyle = _this.signalColor;
        for (i = 1; i < _this.pointNum; i++) {

            _this.ctx.moveTo(pointX[i - 1], pointY[i - 1]);
            _this.ctx.lineTo(pointX[i], pointY[i]);
        }
        _this.ctx.stroke();
        _this.ctx.closePath();
        _this.ctx.save();
    };

    this.drawBackground = function () {

        var ctx = _this.ctx;
        //刷背景//
        ctx.beginPath();
        /* 将这个渐变设置为fillStyle */
        // ctx.fillStyle = grad;
        ctx.fillStyle = _this.bgColor;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "RGB(25, 25, 25)";
        ctx.fillRect(0, 0, _this.width, _this.height);
        ctx.strokeRect(3, 3, _this.width - 6, _this.height - 6);
        ctx.closePath();

        //刷网格背景//
        //画网格矩形边框和填充
        ctx.beginPath();
        ctx.fillStyle = _this.screenColor;
        ctx.lineWidth = 1;
        ctx.strokeStyle = _this.gridColor;
        ctx.fillRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
        ctx.strokeRect(_this.offsetL + 0.5, _this.offsetT + 0.5, _this.waveWidth, _this.waveHeight);
        ctx.closePath();

        var nRow = _this.nRow;
        var nCol = _this.nCol;
        var divX = _this.waveWidth / nCol;
        var divY = _this.waveHeight / nRow;
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.strokeStyle = _this.gridColor;

        var i, j;
        //绘制横向网格线
        for (i = 1; i < nRow; i++) {
            if (i == 4) {

                ctx.lineWidth = 10;
            }
            else {

                ctx.lineWidth = 1;
            }
            ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
            ctx.lineTo(_this.width - _this.offsetR, divY * i + _this.offsetT);
        }
        //绘制纵向网格线
        for (j = 1; j < nCol; j++) {

            if (i == 4) {

                ctx.lineWidth = 10;
            }
            else {

                ctx.lineWidth = 1;
            }
            ctx.moveTo(divX * j + _this.offsetL, _this.offsetT);
            ctx.lineTo(divX * j + _this.offsetL, _this.height - _this.offsetB);
        }
        ctx.stroke();
        ctx.closePath();
        //////////////////////////////////////////////////////

        if ((_this.height >= 200) && (_this.width >= 200)) {
            //绘制横纵刻度
            var scaleYNum = 20;
            var scaleXNum = 20;
            var scaleYStep = _this.waveHeight / scaleYNum;
            var scaleXStep = _this.waveWidth / scaleXNum;
            ////////////////画数字字体////////////////
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = _this.fontColor;
            ctx.font = "normal 14px Calibri";

            var xValStep = (_this.MaxVal - _this.MinVal) / scaleXNum;
            var yValStep = (_this.MaxVal - _this.MinVal) / scaleYNum;

            ctx.fillStyle = _this.fontColor;
            var temp = 0;
            var strLab;
            //横坐标刻度//
            for (i = 2; i < scaleXNum; i += 4) {

                temp = _this.MinVal + xValStep * i;
                if (Math.abs(temp) >= 1000) {

                    temp = temp / 1000;
                    strLab = temp.toFixed(1).toString() + 'k';
                }
                else if (Math.abs(temp) < 1000 && Math.abs(temp) >= 100) {

                    strLab = temp.toFixed(0).toString();
                }
                else if (Math.abs(temp) < 100 && Math.abs(temp) >= 10) {

                    strLab = temp.toFixed(1).toString();
                }
                else if (Math.abs(temp) < 10) {

                    strLab = temp.toFixed(1).toString();
                }
                ctx.fillText(strLab, _this.offsetL + scaleXStep * i - 9, _this.height - 10);
            }
            //纵坐标刻度//
            for (i = 2; i < scaleYNum; i += 4) {

                temp = _this.MaxVal - yValStep * i;
                if (Math.abs(temp) >= 1000) {

                    temp = temp / 1000;
                    strLab = temp.toFixed(1).toString() + 'k';
                }
                else if (Math.abs(temp) < 1000 && Math.abs(temp) >= 100) {

                    strLab = temp.toFixed(0).toString();
                }
                else if (Math.abs(temp) < 100 && Math.abs(temp) >= 10) {

                    strLab = temp.toFixed(1).toString();
                }
                else if (Math.abs(temp) < 10) {

                    strLab = temp.toFixed(1).toString();
                }
                ctx.fillText(strLab, _this.offsetL - 30, _this.offsetT + scaleYStep * i + 5);
            }
            ctx.closePath();
            ctx.save();
        }
    };

    this.drawBackground();

    this.drawRuler = function () {

        //画标尺//
        _this.ctx.beginPath();
        _this.ctx.lineWidth = 1;
        _this.ctx.lineCap = "round";
        _this.ctx.strokeStyle = _this.rulerColor;
        _this.ctx.font = "normal 14px Calibri";
        _this.ctx.fillStyle = _this.rulerColor;

        //竖标尺//
        _this.ctx.moveTo(_this.curPointX + 0.5, _this.offsetT);
        _this.ctx.lineTo(_this.curPointX + 0.5, _this.height - _this.offsetB);
        _this.ctx.stroke();
        var i;
        var curPointX = ((_this.curPointX - _this.offsetL) * (_this.MaxVal - _this.MinVal) / _this.waveWidth + _this.MinVal).toFixed(1);
        var curPointY = [];
        for (i = 0; i < _this.pointNum; i++) {

            if (parseFloat(_this.bufferValX[i]).toFixed(1) === curPointX) {

                curPointY.push(parseFloat(_this.bufferValY[i]).toFixed(1));
                if (curPointY.length >= 5) {

                    break;
                }
            }
        }
        for (i = 0; i < curPointY.length; i++) {

            _this.ctx.fillText('(' + curPointX + ', ' + curPointY[i] + ')',
                _this.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15 + i * 15);
        }
        _this.ctx.closePath();
    };

    this.setData = function (dataX, dataY) {

        if ((dataX == null || undefined) || (dataY == null || undefined)) {

            return false;
        }

        _this.pointNum = dataX.length > dataY.length ? dataY.length : dataX.length; //取较短的数据长度
        if (isNaN(_this.pointNum)) {

            return false;
        }
        var XMax = 0, XMin = 0, YMax = 0, YMin = 0;
        var i;
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferValY[i] = dataY[i] == undefined ? 0 : dataY[i];
            YMax = YMax < _this.bufferValY[i] ? _this.bufferValY[i] : YMax;
            YMin = YMin > _this.bufferValY[i] ? _this.bufferValY[i] : YMin;
        }
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferValX[i] = dataX[i] == undefined ? 0 : dataX[i];
            XMax = XMax < _this.bufferValX[i] ? _this.bufferValX[i] : XMax;
            XMin = XMin > _this.bufferValX[i] ? _this.bufferValX[i] : XMin;
        }
        if (_this.autoZoom) {

            var XYMax = YMax > XMax ? YMax : XMax;
            var XYMin = YMin > XMin ? XMin : YMin;
            if ((_this.MaxVal <= XYMax) || (_this.MaxVal - XYMax > 5 * (XYMax - XYMin))) {

                _this.MaxVal = 2 * XYMax - XYMin;
                _this.MinVal = 2 * XYMin - XYMax;
            }
            if ((_this.MinVal >= XYMin) || (XYMin - _this.MaxVal > 5 * (XYMax - XYMin))) {

                _this.MaxVal = 2 * XYMax - XYMin;
                _this.MinVal = 2 * XYMin - XYMax;
            }
            if (XYMax < 0.01 && XYMin > -0.01) {

                _this.MaxVal = 1;
                _this.MinVal = -1;
            }
        }
        _this.draw();
    };

    this.setAxisRange = function (min, max) {

        _this.MinVal = min;
        _this.MaxVal = max;
        _this.drawBackground();
    };

    this.setRowColNum = function (row, col) {

        _this.nRow = row;
        _this.nCol = col;
        _this.drawBackground();
    };

    this.reset = function () {
        var i;
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferValY[i] = 0.0;
            _this.bufferValX[i] = 0.0;
        }
        _this.drawBackground();
    };

    var _mouseOverFlag = false;
    var _mouseOutFlag = false;
    var _dragAndDropFlag = false;
    var _mouseUpFlag = false;
    var _onclickFlag = false;
    var _mouseMoveFlag = false;

    this.attachEvent = function (event, handler) {

        switch (event) {
            case 'mouseOver':
                this.mouseOver = handler;
                _mouseOverFlag = true;
                break;
            case 'mouseOut':
                this.mouseOut = handler;
                _mouseOutFlag = true;
                break;
            case 'dragAndDrop':
                this.dragAndDrop = handler;
                _dragAndDropFlag = true;
                break;
            case 'mouseUp':
                this.mouseUp = handler;
                _mouseUpFlag = true;
                break;
            case 'onclick':
                this.onclick = handler;
                _onclickFlag = true;
                break;
            case 'mouseMove':
                this.mouseMove = handler;
                _mouseMoveFlag = true;
                break;
                break;
        }
    };

    this.detachEvent = function (event) {

        switch (event) {
            case 'mouseOver':
                _mouseOverFlag = false;
                break;
            case 'mouseOut':
                _mouseOutFlag = false;
                break;
            case 'dragAndDrop':
                _dragAndDropFlag = false;
                break;
            case 'mouseUp':
                _mouseUpFlag = false;
                break;
            case 'onclick':
                _onclickFlag = false;
                break;
            case 'mouseMove':
                _mouseMoveFlag = false;
                break;
                break;
        }

    };

    function onMouseMove(event) {
        if (!_this.drawRulerFlag || _this.bufferValY.length == 0) {

            return;
        }
        _this.curPointX = event.offsetX == undefined ? event.layerX : event.offsetX - 5;
        _this.curPointY = event.offsetY == undefined ? event.layerY : event.offsetY - 5;

        if (_this.curPointX <= _this.offsetL) {
            _this.curPointX = _this.offsetL;
        }
        if (_this.curPointX >= (_this.width - _this.offsetR)) {
            _this.curPointX = _this.width - _this.offsetR;
        }
        _this.draw();
    }

    function onContainerMouseDown(event) {
    }

    function onContainerMouseUp(event) {
    }

    // this.canvas.addEventListener('mousedown', onContainerMouseDown, false);  // mouseDownListener
    this.canvas.addEventListener('mousemove', onMouseMove, false);   // mouseMoveListener
    // this.canvas.addEventListener('mouseup', onContainerMouseUp, false);  // mouseUpListener
};

VILibrary.OscillationResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'OscillationResponseVI';
    this.cnText = '震荡响应';
    this.runningFlag = false;

    this.signalType = 7;
    this.k1 = 50;
    this.k2 = 0.05;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v, a1, b1;

        //二阶 W^2/(S^2+2gWS+W^2)
        if (_this.k2 > 1) {

            _this.k2 = 1;
        }
        b1 = Math.exp(-2 * 6.28 * _this.k1 * _this.k2 / _this.Fs);
        a1 = 2 * Math.exp(-6.28 * _this.k1 * _this.k2 / _this.Fs) * Math.cos(6.28 * _this.k1 * Math.sqrt(1 - _this.k2 * _this.k2) / _this.Fs);
        v = a1 * _this.temp1 - b1 * _this.temp2 + 1 * (1 - a1 + b1) * _this.input;
        _this.temp2 = _this.temp1;
        _this.temp1 = v;
        _this.singleOutput = v;//输出


        //将输出数保存在数组内
        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;

    };

    this.reset = function () {

        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };


    this.draw = function () {

        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('震荡', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.PIDVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext('2d');
    this.name = 'PIDVI';
    this.cnText = 'PID';
    this.runningFlag = false;

    this.input = 0;
    this.lastInput = 0;
    this.singleOutput = 0;
    this.P = 1;
    this.I = 1;
    this.D = 1;
    this.Fs = 100;
    this.temp1 = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    /**
     *
     * @param input 从输入端读取的数据
     */
    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v1, v2, v3, v21;

        v1 = _this.P * _this.input;

        v21 = _this.temp1 + 0.5 * (Number(_this.input) + Number(_this.lastInput)) / _this.Fs;
        // console.log(v21);
        _this.temp1 = v21;
        v2 = _this.I * v21;

        v3 = _this.D * (_this.input - _this.lastInput) * _this.Fs;

        _this.lastInput = _this.input;
        _this.singleOutput = v1 + v2 + v3;

        //将输出数保存在数组内
        var i = 0;
        // if (_this.index == 0) {
        //     for (i = 0; i < _this.dataLength; i++) {
        //         _this.output[i] = 0;
        //     }
        // }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;
    };


    this.reset = function () {

        _this.input = 0;
        _this.lastInput = 0;
        _this.singleOutput = 0;
        _this.P = 1;
        _this.I = 1;
        _this.D = 1;
        _this.Fs = 100;
        _this.temp1 = 0;
        _this.index = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('PID', _this.container.width / 2 - 11, _this.container.height / 2 + 6);
    };

    this.draw();
};

VILibrary.ProportionDifferentiationResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'ProportionDifferentiationResponseVI';
    this.cnText = '比例微分响应';
    this.runningFlag = false;

    this.signalType = 5;
    this.k1 = 1;
    this.k2 = 0;
    this.k3 = 0.0025;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v1, v3;

        v1 = _this.k1 * _this.input;

        v3 = _this.k3 * (_this.input - _this.lastInput) * _this.Fs;

        _this.singleOutput = v1 + v3;
        _this.lastInput = _this.input;


        //将输出数保存在数组内
        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('微分', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.ProportionInertiaResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'ProportionInertiaResponseVI';
    this.cnText = '比例惯性响应';
    this.runningFlag = false;

    this.signalType = 8;
    this.k1 = 0.025;
    this.k2 = 1;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];
    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v, E;

        //一阶 X+1/(TS+1)
        E = Math.exp(-1 / (_this.k1 * _this.Fs));
        v = E * _this.temp1 + (1.0 - E) * _this.input;
        _this.temp1 = v;
        _this.singleOutput = v + _this.k2 * _this.input;//输出

        //将输出数保存在数组内
        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };


    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('惯性', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.ProportionIntegrationResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'ProportionIntegrationResponseVI';
    this.cnText = '比例积分响应';
    this.runningFlag = false;

    this.signalType = 4;
    this.k1 = 1.5;
    this.k2 = 1;
    this.k3 = 0;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        var v1, v2, v21;

        if (_this.signalType < 6) {
            v1 = _this.k1 * _this.input;

            v21 = _this.temp1 + 0.5 * (_this.input + _this.lastInput) / _this.Fs;
            _this.temp1 = v21;
            v2 = _this.k2 * v21;

            _this.singleOutput = v1 + v2;
            _this.lastInput = _this.input;
        }

        //将输出数保存在数组内
        var i = 0;
        // if (_this.index == 0) {
        //     for (i = 0; i < _this.dataLength; i++) {
        //         _this.output[i] = 0;
        //     }
        // }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };


    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('积分', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.ProportionResponseVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'ProportionResponseVI';
    this.cnText = '比例响应';
    this.runningFlag = false;

    this.signalType = 1;
    this.k1 = 1.5;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }

        _this.singleOutput = _this.k1 * _this.input;

        //将输出数保存在数组内
        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };


    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.RelayVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'RelayVI';
    this.cnText = '中继器';
    this.runningFlag = false;
    this.input = 0;
    this.singleOutput = 0;
    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }
        _this.singleOutput = _this.input;

        var i = 0;
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }
        return _this.singleOutput;
    };

    this.reset = function () {

        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('中继器', _this.container.width / 2 - 18, _this.container.height / 2 + 6);
    };

    this.draw();
};

VILibrary.RotorExperimentalRigVI = function (domElement, draw3DFlag) {

    var _this = this;
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

        _this.rotateSpeed = VILibrary.isArray(rotateSpeed) ? rotateSpeed[rotateSpeed.length - 1] : rotateSpeed;
        if (isNaN(_this.rotateSpeed)) {

            return false;
        }
        _this.rotateFrequency = _this.rotateSpeed / 60;
    };

    function VIDraw() {
        var img = new Image();
        img.src = 'img/RotorExperimentalRig.png';
        img.onload = function () {

            _this.ctx.drawImage(img, 0, 0, _this.canvas.width, _this.canvas.height);
        };
    }

    var camera, scene, renderer, controls, base, rotor, offSwitch, onSwitch, switchControl, loadedFlag = false,
        timer1, timer2, phase = 0, sampleFrequency = 8192, dt = 1 / sampleFrequency;

    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

    if (draw3DFlag) {

        var loadingImg = document.createElement('img');
        loadingImg.src = 'img/loading.gif';
        loadingImg.style.width = '64px';
        loadingImg.style.height = '64px';
        loadingImg.style.position = 'absolute';
        loadingImg.style.top = domElement.offsetTop + domElement.offsetHeight / 2 - 32 + 'px';
        loadingImg.style.left = domElement.offsetLeft + domElement.offsetWidth / 2 - 32 + 'px';
        loadingImg.style.zIndex = '1001';
        domElement.parentNode.appendChild(loadingImg);

        var mtlLoader = new THREE.MTLLoader();
        var objLoader = new THREE.OBJLoader();

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

        var i;
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

    this.draw = function () {

        if (draw3DFlag) {

            var timer = window.setInterval(function () {
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
};

VILibrary.RoundPanelVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext('2d');
    this.width = this.container.width;
    this.height = this.container.height;
    this.R = _this.width > _this.height ? _this.height / 2 : _this.width / 2;
    this.radius = this.R * 0.9;

    this.name = 'RoundPanelVI';
    this.cnText = '圆表盘';
    this.runningFlag = false;
    this.latestInput = 0;
    this.handAngle = Math.PI * 5 / 6;
    this.panelRangeAngle = Math.PI * 4 / 3;

    this.minValue = 0;
    this.maxValue = 100;
    this.bigSectionNum = 10;
    this.smallSectionNum = 10;
    this.unit = '';
    this.title = '';
    this.bgColor = "RGB(249, 250, 249)";
    this.screenColor = "RGB(61, 132, 185)";
    this.borderColor = "RGB(100,100,100)";

    this.fontColor = "RGB(0, 0, 0)";
    this.fontSize = (16 * _this.radius / 150).toFixed(0);

    //虚拟仪器中相连接的控件VI
    this.source = [];

    function parsePosition(angle) {

        var position = [];
        position[0] = _this.radius * 0.82 * Math.cos(angle);
        position[1] = _this.radius * 0.82 * Math.sin(angle);
        return position;
    }

    function dataFormation(data) {

        data = parseFloat(data);
        if (data == 0) {

            return '0';
        }
        if (Math.abs(data) >= 1000) {

            data = data / 1000;
            data = data.toFixed(1).toString() + 'k';
        }
        else if (Math.abs(data) < 1000 && Math.abs(data) >= 100) {

            data = data.toFixed(0).toString();
        }
        else if (Math.abs(data) < 100 && Math.abs(data) >= 10) {

            data = data.toFixed(1).toString();
        }
        else if (Math.abs(data) < 10) {

            data = data.toFixed(2).toString();
        }
        return data;
    }

    this.setRange = function (minVal, maxVal, unitText, titleText) {

        minVal = isArray(minVal) ? minVal[minVal.length - 1] : minVal;
        if (isNaN(minVal)) {

            return false;
        }
        maxVal = isArray(maxVal) ? maxVal[maxVal.length - 1] : maxVal;
        if (isNaN(maxVal)) {

            return false;
        }
        if (maxVal < minVal) {

            return false;
        }
        _this.minValue = minVal;
        _this.maxValue = maxVal;

        if (typeof unitText === 'string') {

            _this.unit = unitText;
        }

        if (typeof titleText === 'string') {

            _this.title = titleText;
        }
        _this.draw();

    };

    this.setData = function (latestInput) {

        _this.latestInput = VILibrary.isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
        if (isNaN(_this.latestInput)) {

            return false;
        }
        _this.latestInput = _this.latestInput < _this.minValue ? _this.minValue : _this.latestInput;
        _this.latestInput = _this.latestInput > _this.maxValue ? _this.maxValue : _this.latestInput;
        _this.latestInput = parseFloat(_this.latestInput).toFixed(2);
        _this.handAngle = Math.PI * 5 / 6 + _this.latestInput / _this.maxValue * _this.panelRangeAngle;
        _this.draw();
    };

    this.drawHand = function () {

        _this.ctx.save();
        // 位移到目标点
        _this.ctx.translate(this.R, this.R);
        _this.ctx.rotate(_this.handAngle);
        _this.ctx.moveTo(-_this.radius * 0.05, 0);
        _this.ctx.lineTo(0, -_this.radius * 0.02);
        _this.ctx.lineTo(_this.radius * 0.75, 0);
        _this.ctx.lineTo(0, _this.radius * 0.02);
        _this.ctx.lineTo(-_this.radius * 0.05, 0);
        _this.ctx.fillStyle = _this.screenColor;
        _this.ctx.fill();
        _this.ctx.restore();

    };

    this.reset = function () {

        _this.latestInput = 0;
    };

    this.draw = function () {

        // 画出背景边框
        _this.ctx.beginPath();
        _this.ctx.arc(this.R, this.R, _this.R, 0, 360, false);
        _this.ctx.lineTo(this.R * 2, this.R);
        _this.ctx.fillStyle = _this.borderColor;//填充颜色
        _this.ctx.fill();//画实心圆
        _this.ctx.closePath();
        // 画出背景圆
        _this.ctx.beginPath();
        _this.ctx.arc(this.R, this.R, _this.R * 0.97, 0, 360, false);
        _this.ctx.fillStyle = _this.bgColor;//填充颜色
        _this.ctx.fill();//画实心圆
        _this.ctx.closePath();
        // 保存
        _this.ctx.save();
        // 位移到目标点
        _this.ctx.translate(this.R, this.R);
        // 画出圆弧
        _this.ctx.beginPath();
        _this.ctx.arc(0, 0, _this.radius * 0.98, Math.PI * 5 / 6, Math.PI / 6, false);
        _this.ctx.arc(0, 0, _this.radius, Math.PI / 6, Math.PI * 5 / 6, true);
        _this.ctx.lineTo(_this.radius * 0.98 * Math.cos(Math.PI * 5 / 6), _this.radius * 0.98 * Math.sin(Math.PI * 5 / 6));
        _this.ctx.restore();
        _this.ctx.fillStyle = _this.screenColor;
        _this.ctx.fill();
        _this.ctx.beginPath();
        _this.ctx.lineCap = "round";
        _this.ctx.lineWidth = 2;
        if (_this.radius < 150) {

            _this.ctx.lineWidth = 1;
        }
        _this.ctx.strokeStyle = _this.screenColor;
        var i, j;
        // 保存
        _this.ctx.save();
        // 位移到目标点
        _this.ctx.translate(this.R, this.R);

        var rotateAngle = Math.PI * 5 / 6, position, markStr, fontSize;
        _this.ctx.font = 'normal ' + _this.fontSize / 2 + 'px Microsoft YaHei';
        fontSize = /\d+/.exec(_this.ctx.font)[0];
        for (i = 0; i <= _this.bigSectionNum; i++) {

            _this.ctx.save();
            _this.ctx.rotate(rotateAngle);
            _this.ctx.moveTo(_this.radius * 0.99, 0);
            _this.ctx.lineTo(_this.radius * 0.9, 0);
            _this.ctx.restore();

            if (_this.R > 100) {
                for (j = 1; j < _this.smallSectionNum; j++) {

                    if (i == _this.bigSectionNum) {
                        break;
                    }
                    _this.ctx.save();
                    _this.ctx.rotate(rotateAngle);
                    _this.ctx.rotate(j * _this.panelRangeAngle / _this.smallSectionNum / _this.bigSectionNum);
                    _this.ctx.moveTo(_this.radius * 0.99, 0);
                    _this.ctx.lineTo(_this.radius * 0.95, 0);
                    _this.ctx.restore();
                }

                if (i > 0 && i < _this.bigSectionNum) {

                    markStr = dataFormation((_this.maxValue - _this.minValue) / _this.bigSectionNum * i + _this.minValue);
                    position = parsePosition(rotateAngle);
                    _this.ctx.fillText(markStr, position[0] - fontSize / 4 * markStr.length, position[1]);
                }
            }
            rotateAngle += _this.panelRangeAngle / _this.bigSectionNum;
        }
        markStr = dataFormation(_this.minValue);
        position = parsePosition(Math.PI * 5 / 6);
        _this.ctx.fillText(markStr, position[0] - fontSize / 4 * markStr.length, position[1]);
        markStr = dataFormation(_this.maxValue);
        position = parsePosition(Math.PI * 5 / 6 + _this.panelRangeAngle);
        _this.ctx.fillText(markStr, position[0] - fontSize / 3 * markStr.length, position[1]);
        _this.ctx.restore();

        _this.ctx.font = 'bold ' + _this.fontSize + 'px Microsoft YaHei';
        fontSize = /\d+/.exec(_this.ctx.font)[0];
        markStr = _this.latestInput.toString() + _this.unit;
        _this.ctx.fillText(markStr, this.R - fontSize / 4 * markStr.length, this.R * 3 / 2);
        markStr = _this.title;
        _this.ctx.fillText(markStr, this.R - fontSize / 4 * markStr.length, this.R * 1 / 2);
        _this.ctx.stroke();
        _this.ctx.closePath();
        _this.drawHand();
    };

    this.draw();

};

VILibrary.SignalGeneratorVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'SignalGeneratorVI';
    this.cnText = '信号发生器';
    this.runningFlag = false;
    this.dataSetCount = 0;

    this.dataLength = 1024;
    this.phase = 0;
    this.amp = 1;
    this.frequency = 256;
    this.signalType = 1;
    this.singleOutput = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];

    /**
     * 信号产生函数
     *  采样频率为11025Hz
     * @param amp 信号幅值
     * @param f 信号频率
     * @param phase 信号相位
     *
     */
    this.setData = function (amp, f, phase) {

        _this.amp = (isNaN(amp) || !amp) ? _this.amp : amp;
        _this.frequency = (isNaN(f) || !f) ? _this.frequency : f;
        _this.phase = (isNaN(phase) || !phase) ? _this.phase : phase;
        var FS = 11025;
        var i, j;
        var T = 1 / _this.frequency;//周期
        var dt = 1 / FS;//采样周期
        var t, t1, t2, t3;

        if (_this.frequency <= 0) {

            for (i = 0; i < _this.dataLength; i++) {

                _this.output[i] = 0;
            }
            return _this.output;
        }

        switch (parseInt(_this.signalType)) {
            case 1://正弦波
                for (i = 0; i < _this.dataLength; i++) {

                    _this.output[i] = _this.amp * Math.sin(2 * Math.PI * _this.frequency * i * dt + (2 * Math.PI * _this.phase) / 360);
                }
                _this.singleOutput = _this.output[_this.dataLength - 1];
                break;

            case 2://方波
                t1 = T / 2;//半周期时长
                t3 = T * _this.phase / 360.0;
                for (i = 0; i < _this.dataLength; i++) {

                    t = i * dt + t3;
                    t2 = t - Math.floor(t / T) * T;
                    if (t2 >= t1) {

                        _this.output[i] = -_this.amp;
                    }
                    else {

                        _this.output[i] = _this.amp;
                    }
                }
                _this.singleOutput = _this.output[_this.dataLength - 1];
                break;

            case 3://三角波
                t3 = T * _this.phase / 360.0;
                for (i = 0; i < _this.dataLength; i++) {

                    t = i * dt + t3;
                    t2 = parseInt(t / T);
                    t1 = t - t2 * T;
                    if (t1 <= T / 2) {
                        _this.output[i] = 4 * _this.amp * t1 / T - _this.amp;
                    }
                    else {
                        _this.output[i] = 3 * _this.amp - 4 * _this.amp * t1 / T;
                    }
                }
                _this.singleOutput = _this.output[_this.dataLength - 1];
                break;

            case 4://白噪声
                t2 = 32767;// 0 -- 0x7fff
                for (i = 0; i < _this.dataLength; i++) {
                    t1 = 0;
                    for (j = 0; j < 12; j++) {

                        t1 += (t2 * Math.random());
                    }
                    _this.output[i] = _this.amp * (t1 - 6 * t2) / (3 * t2);
                }
                _this.singleOutput = _this.output[_this.dataLength - 1];
                break;
        }
    };

    this.reset = function () {
        _this.singleOutput = 0;
        _this.output = [0];
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('信号', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('发生器', _this.container.width / 2 - 18, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.StepResponseGeneratorVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'StepResponseGeneratorVI';
    this.cnText = '阶跃响应';
    this.runningFlag = false;

    this.signalType = 0;
    this.k1 = 1;
    this.k2 = 1;
    this.k3 = 1;
    this.Fs = 1000;
    this.input = 0;
    this.lastInput = 0;
    this.temp1 = 0;
    this.temp2 = 0;
    this.singleOutput = 0;

    this.dataLength = 1024;
    this.index = 0;
    this.output = [0];
    this.outputCount = 2;

    //虚拟仪器中相连接的控件VI
    this.source = [];
    this.target = [];


    this.setData = function (input) {

        _this.input = VILibrary.isArray(input) ? input[input.length - 1] : input;
        if (isNaN(_this.input)) {

            return false;
        }
        var v, v1, v2, v21, v3, E, a1, b1;

        if (_this.signalType < 6) {
            v1 = _this.k1 * _this.input;

            v21 = _this.temp1 + 0.5 * (_this.input + _this.lastInput) / _this.Fs;
            _this.temp1 = v21;
            v2 = _this.k2 * v21;

            v3 = _this.k3 * (_this.input - _this.lastInput) * _this.Fs;

            _this.singleOutput = v1 + v2 + v3;
            _this.lastInput = _this.input;
        }
        else if (_this.signalType < 9) {
            if (_this.signalType == 6) { //一阶 1/(TS+1)
                E = Math.exp(-1 / (_this.k1 * _this.Fs));
                v = E * _this.temp1 + (1.0 - E) * _this.input;
                _this.temp1 = v;
                _this.singleOutput = v;//输出
            }
            if (_this.signalType == 7) { //二阶 W^2/(S^2+2gWS+W^2)
                if (_this.k2 > 1)
                    _this.k2 = 1;
                b1 = Math.exp(-2 * 6.28 * _this.k1 * _this.k2 / _this.Fs);
                a1 = 2 * Math.exp(-6.28 * _this.k1 * _this.k2 / _this.Fs) * Math.cos(6.28 * _this.k1 * Math.sqrt(1 - _this.k2 * _this.k2) / _this.Fs);
                v = a1 * _this.temp1 - b1 * _this.temp2 + 1 * (1 - a1 + b1) * _this.input;
                _this.temp2 = _this.temp1;
                _this.temp1 = v;
                _this.singleOutput = v;//输出
            }
            if (_this.signalType == 8) { //一阶 X+1/(TS+1)
                E = Math.exp(-1 / (_this.k1 * _this.Fs));
                v = E * _this.temp1 + (1.0 - E) * _this.input;
                _this.temp1 = v;
                _this.singleOutput = v + _this.k2 * _this.input;//输出
            }
        }
        else _this.singleOutput = 0;


        //将输出数保存在数组内
        var i = 0;
        if (_this.index == 0) {
            for (i = 0; i < _this.dataLength; i++) {
                _this.output[i] = 0;
            }
        }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.singleOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.singleOutput;
        }

        return _this.singleOutput;

    };


    this.setStepType = function (type) {

        _this.signalType = type;

        //PID控制器
        if (_this.signalType == 0) {
            _this.k1 = 1;
            _this.k2 = 1;
            _this.k3 = 1;
        }

        //比例控制器
        if (_this.signalType == 1) {
            _this.k1 = 1;
            _this.k2 = 0;
            _this.k3 = 0;
        }

        //积分控制器
        if (_this.signalType == 2) {
            _this.k1 = 0;
            _this.k2 = 1;
            _this.k3 = 0;
        }

        //微分控制器
        if (_this.signalType == 3) {
            _this.k1 = 0;
            _this.k2 = 0;
            _this.k3 = 1;
        }

        //比例积分控制器
        if (_this.signalType == 4) {
            _this.k1 = 1;
            _this.k2 = 1;
            _this.k3 = 0;
        }

        //比例微分控制器
        if (_this.signalType == 5) {
            _this.k1 = 1;
            _this.k2 = 0;
            _this.k3 = 1;
        }

        //惯性环节
        if (_this.signalType == 6) {
            _this.k1 = 1;
            _this.k2 = 0;
        }

        //振荡环节
        if (_this.signalType == 7) {
            _this.k1 = 1;
            _this.k2 = 1;
        }

        //比例惯性环节
        if (_this.signalType == 8) {
            _this.k1 = 1;
            _this.k2 = 1;
        }

    };

    this.reset = function () {
        _this.lastInput = 0;
        _this.temp1 = 0;
        _this.temp2 = 0;
        _this.index = 0;
        _this.singleOutput = 0;
        _this.output = [0];
    };


    this.draw = function () {
        _this.ctx.font = 'normal 12px Microsoft YaHei';
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText(_this.cnText.substring(0, 2), _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText(_this.cnText.substring(2), _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
};

VILibrary.TextVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'TextVI';
    this.cnText = '文本框';
    this.runningFlag = false;

    this.latestInput = 0;
    this.decimalPlace = 1;


    //虚拟仪器中相连接的控件VI
    this.source = [];

    this.setData = function (latestInput) {

        _this.latestInput = VILibrary.isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
        if (isNaN(_this.latestInput)) {

            return false;
        }

        var str = parseFloat(_this.latestInput).toFixed(_this.decimalPlace);
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText(str, _this.container.width / 2 - 6 * str.length, _this.container.height / 2 + 6);
    };

    this.setDecimalPlace = function (decimalPlace) {

        _this.decimalPlace = parseInt(decimalPlace);
        _this.setData(_this.latestInput);
    };

    this.reset = function () {

        this.originalInput = 0;
        this.latestInput = 0;
        this.singleOutput = 0;
        _this.index = 0;
    };

    this.draw = function () {

        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('文本框', _this.container.width / 2 - 18, _this.container.height / 2 + 6);
    };

    this.draw();
};

VILibrary.WaveVI = function (domElement) {

    var _this = this;
    this.container = domElement;
    this.ctx = this.container.getContext("2d");
    this.name = 'WaveVI';
    this.cnText = '波形控件';
    this.runningFlag = false;

    this.width = this.container.width; //内框宽度//
    this.height = this.container.height; //内框高度//
    //坐标单位//
    this.strLabelX = 'X';
    this.strLabelY = 'Y';

    //坐标数值//
    this.XMaxVal = 1023;
    this.XMinVal = 0;
    this.YMaxVal = 10;
    this.YMinVal = -10;
    this.autoZoom = true;

    //网格行列数//
    this.nRow = 4;
    this.nCol = 8;
    this.pointNum = 1023;
    this.drawRulerFlag = true;

    //网格矩形四周边距 TOP RIGHT BOTTOM LEFT//

    this.offsetT = 10;
    this.offsetR = 10;

    this.offsetB = 10;
    this.offsetL = 10;
    if ((_this.height >= 200) && (_this.width >= 200)) {

        _this.offsetB = 35;
        _this.offsetL = 42;
    }
    this.waveWidth = this.width - this.offsetL - this.offsetR;
    this.waveHeight = this.height - this.offsetT - this.offsetB;

    //颜色选型//
    this.bgColor = "RGB(249, 250, 249)";
    this.screenColor = "RGB(61, 132, 185)";
    this.gridColor = "RGB(200, 200, 200)";
    this.fontColor = "RGB(0, 0, 0)";
    this.signalColor = "RGB(255, 255, 0)";
    this.rulerColor = "RGB(255, 255, 255)";

    //缓冲数组
    this.bufferVal = [];
    this.curPointX = this.offsetL;
    this.curPointY = this.offsetT;

    //虚拟仪器中相连接的控件VI
    this.source = [];

    this.draw = function () {

        _this.drawBackground();
        _this.drawWave();
        if (_this.drawRulerFlag) {

            _this.drawRuler();
        }
    };

    this.drawWave = function () {

        var ratioX = _this.waveWidth / (_this.pointNum - 1);
        var ratioY = _this.waveHeight / (_this.YMaxVal - _this.YMinVal);
        var pointX = [];
        var pointY = [];

        var i;
        for (i = 0; i < _this.pointNum; i++) {

            pointX[i] = _this.offsetL + i * ratioX;
            pointY[i] = _this.offsetT + (_this.YMaxVal - _this.bufferVal[i]) * ratioY;
            if (pointY[i] < _this.offsetT) {

                pointY[i] = _this.offsetT;
            }
            if (pointY[i] > (_this.offsetT + _this.waveHeight)) {

                pointY[i] = _this.offsetT + _this.waveHeight;
            }
        }
        //绘制波形曲线
        _this.ctx.beginPath();
        _this.ctx.lineWidth = 2;
        _this.ctx.lineCap = "round";
        _this.ctx.strokeStyle = _this.signalColor;
        _this.ctx.moveTo(pointX[0], pointY[0]);
        for (i = 1; i < _this.pointNum; i++) {

            _this.ctx.lineTo(pointX[i], pointY[i]);
        }
        _this.ctx.stroke();
        _this.ctx.closePath();
        _this.ctx.save();
    };

    this.drawBackground = function () {

        var ctx = _this.ctx;
        //刷背景//
        ctx.beginPath();
        /* 将这个渐变设置为fillStyle */
        // ctx.fillStyle = grad;
        ctx.fillStyle = _this.bgColor;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "RGB(25, 25, 25)";
        ctx.fillRect(0, 0, _this.width, _this.height);
        ctx.strokeRect(3, 3, _this.width - 6, _this.height - 6);
        ctx.closePath();

        //画网格矩形边框和填充
        ctx.beginPath();
        ctx.fillStyle = _this.screenColor;
        ctx.lineWidth = 1;
        ctx.strokeStyle = _this.gridColor;
        ctx.fillRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
        ctx.strokeRect(_this.offsetL + 0.5, _this.offsetT + 0.5, _this.waveWidth, _this.waveHeight);
        ctx.closePath();

        var nRow = _this.nRow;
        var nCol = _this.nCol;
        var divX = _this.waveWidth / nCol;
        var divY = _this.waveHeight / nRow;

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.strokeStyle = _this.gridColor;

        var i, j;
        //绘制横向网格线
        for (i = 1; i < nRow; i++) {

            ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
            ctx.lineTo(_this.width - _this.offsetR, divY * i + _this.offsetT);
        }
        //绘制纵向网格线
        for (j = 1; j < nCol; j++) {

            ctx.moveTo(divX * j + _this.offsetL, _this.offsetT);
            ctx.lineTo(divX * j + _this.offsetL, _this.height - _this.offsetB);
        }
        ctx.stroke();
        ctx.closePath();

        if ((_this.height >= 200) && (_this.width >= 200)) {

            //绘制横纵刻度
            var scaleYNum = 8;
            var scaleXNum = 16;
            var scaleYStep = _this.waveHeight / scaleYNum;
            var scaleXStep = _this.waveWidth / scaleXNum;
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = _this.fontColor;
            //画纵刻度
            var k;
            for (k = 2; k < scaleYNum; k += 2) {


                ctx.moveTo(_this.offsetL - 6, _this.offsetT + k * scaleYStep);
                ctx.lineTo(_this.offsetL, _this.offsetT + k * scaleYStep);

            }
            //画横刻度
            for (k = 2; k < scaleXNum; k += 2) {


                ctx.moveTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight);
                ctx.lineTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight + 7);

            }
            ctx.stroke();
            ctx.closePath();
            ////////////////画数字字体////////////////
            ctx.font = "normal 12px Calibri";

            var strLab;
            //横标签//
            strLab = _this.strLabelX;
            ctx.fillText(strLab, _this.width - _this.offsetR - strLab.length * 6 - 10, _this.height - _this.offsetB + 20);

            //纵标签//
            strLab = _this.strLabelY;
            ctx.fillText(strLab, strLab.length * 6, _this.offsetT + 12);

            var xvalstep = (_this.XMaxVal - _this.XMinVal) / scaleXNum;
            var yvalstep = (_this.YMaxVal - _this.YMinVal) / scaleYNum;

            ctx.fillStyle = _this.fontColor;
            var temp = 0;
            //横坐标刻度//
            for (i = 2; i < scaleXNum; i += 2) {

                temp = _this.XMinVal + xvalstep * i;
                if (Math.abs(temp) >= 1000) {

                    temp = temp / 1000;
                    strLab = temp.toFixed(1).toString() + 'k';
                }
                else if (Math.abs(temp) < 1000 && Math.abs(temp) >= 100) {

                    strLab = temp.toFixed(0).toString();
                }
                else if (Math.abs(temp) < 100 && Math.abs(temp) >= 10) {

                    strLab = temp.toFixed(1).toString();
                }
                else if (Math.abs(temp) < 10) {

                    strLab = temp.toFixed(2).toString();
                }
                ctx.fillText(strLab, _this.offsetL + scaleXStep * i - 9, _this.height - 10);
            }
            //纵坐标刻度//
            for (i = 2; i < scaleYNum; i += 2) {

                temp = _this.YMaxVal - yvalstep * i;
                if (Math.abs(temp) >= 1000) {

                    temp = temp / 1000;
                    strLab = temp.toFixed(1).toString() + 'k';
                }
                else if (Math.abs(temp) < 1000 && Math.abs(temp) >= 10) {

                    strLab = temp.toFixed(0).toString();
                }
                else if (Math.abs(temp) < 10) {

                    strLab = temp.toFixed(1).toString();
                }
                ctx.fillText(strLab, _this.offsetL - 35, _this.offsetT + scaleYStep * i + 5);
            }
            ctx.closePath();
            ctx.save();
        }
    };

    this.drawBackground();

    this.drawRuler = function () {

        //画标尺//
        _this.ctx.beginPath();
        _this.ctx.lineWidth = 1;
        _this.ctx.lineCap = "round";
        _this.ctx.strokeStyle = _this.rulerColor;
        _this.ctx.font = "normal 14px Calibri";
        _this.ctx.fillStyle = _this.rulerColor;

        //竖标尺//
        _this.ctx.moveTo(_this.curPointX + 0.5, _this.offsetT);
        _this.ctx.lineTo(_this.curPointX + 0.5, _this.height - _this.offsetB);
        _this.ctx.stroke();
        var curPointX = ((_this.curPointX - _this.offsetL) * (_this.XMaxVal - _this.XMinVal) / _this.waveWidth).toFixed(2);
        var curPointY = parseFloat(_this.bufferVal[((_this.curPointX - _this.offsetL) * _this.pointNum / _this.waveWidth).toFixed(0)]).toFixed(2);
        _this.ctx.fillText('(' + curPointX + ',' + curPointY + ')',
            _this.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15);
        _this.ctx.closePath();
    };

    this.reset = function () {

        _this.bufferVal = [];
        _this.drawBackground();
    };

    this.setData = function (data, len) {

        if (len == undefined) {

            _this.pointNum = data.length > _this.pointNum ? data.length : _this.pointNum;
        }
        else {

            _this.pointNum = len;
        }
        // console.log(data);
        var YMax = 0, YMin = 0, i;
        for (i = 0; i < _this.pointNum; i++) {

            _this.bufferVal[i] = data[i] == undefined ? 0 : data[i];
            YMax = YMax < _this.bufferVal[i] ? _this.bufferVal[i] : YMax;
            YMin = YMin > _this.bufferVal[i] ? _this.bufferVal[i] : YMin;
        }
        if (_this.autoZoom) {

            if ((_this.YMaxVal <= YMax) || (_this.YMaxVal - YMax > 5 * (YMax - YMin))) {

                _this.YMaxVal = 2 * YMax - YMin;
                _this.YMinVal = 2 * YMin - YMax;
            }
            if ((_this.YMinVal >= YMin) || (YMin - _this.YMaxVal > 5 * (YMax - YMin))) {

                _this.YMaxVal = 2 * YMax - YMin;
                _this.YMinVal = 2 * YMin - YMax;
            }
            if (YMax < 0.01 && YMin > -0.01) {

                _this.YMaxVal = 1;
                _this.YMinVal = -1;
            }
        }
        _this.draw();
    };

    this.setAxisRangX = function (xMin, xNax) {

        _this.XMinVal = xMin;
        _this.XMaxVal = xNax;
        _this.drawBackground();
    };

    this.setAxisRangY = function (yMin, yMax) {

        _this.YMinVal = yMin;
        _this.YMaxVal = yMax;
        _this.drawBackground();
    };

    this.setPointNum = function (num) {

        _this.pointNum = num;
        _this.drawBackground();
    };

    this.setLabel = function (xLabel, yLabel) {

        this.strLabelX = xLabel;
        this.strLabelY = yLabel;
        _this.drawBackground();
    };

    this.setRowColNum = function (row, col) {

        _this.nRow = row;
        _this.nCol = col;
        _this.drawBackground();
    };

    var _mouseOverFlag = false;
    var _mouseOutFlag = false;
    var _dragAndDropFlag = false;
    var _mouseUpFlag = false;
    var _onclickFlag = false;
    var _mouseMoveFlag = false;

    this.dragAndDrop = function () {
    };// this.container.style.cursor = 'move';
    this.mouseOver = function () {
    }; // this.container.style.cursor = 'pointer';
    this.mouseOut = function () {
    }; // this.container.style.cursor = 'auto';
    this.mouseUp = function () {
    }; // this.container.style.cursor = 'auto';
    this.mouseMove = function () {
    };
    this.onclick = function () {
    };

    this.attachEvent = function (event, handler) {

        switch (event) {
            case 'mouseOver':
                this.mouseOver = handler;
                _mouseOverFlag = true;
                break;
            case 'mouseOut':
                this.mouseOut = handler;
                _mouseOutFlag = true;
                break;
            case 'dragAndDrop':
                this.dragAndDrop = handler;
                _dragAndDropFlag = true;
                break;
            case 'mouseUp':
                this.mouseUp = handler;
                _mouseUpFlag = true;
                break;
            case 'onclick':
                this.onclick = handler;
                _onclickFlag = true;
                break;
            case 'mouseMove':
                this.mouseMove = handler;
                _mouseMoveFlag = true;
                break;
                break;
        }
    };

    this.detachEvent = function (event) {

        switch (event) {
            case 'mouseOver':
                _mouseOverFlag = false;
                break;
            case 'mouseOut':
                _mouseOutFlag = false;
                break;
            case 'dragAndDrop':
                _dragAndDropFlag = false;
                break;
            case 'mouseUp':
                _mouseUpFlag = false;
                break;
            case 'onclick':
                _onclickFlag = false;
                break;
            case 'mouseMove':
                _mouseMoveFlag = false;
                break;
                break;
        }

    };

    function onMouseMove(event) {

        if (!_this.drawRulerFlag || _this.bufferVal.length == 0) {

            return;
        }
        _this.curPointX = event.offsetX == undefined ? event.layerX : event.offsetX - 1;
        _this.curPointY = event.offsetY == undefined ? event.layerY : event.offsetY - 1;

        if (_this.curPointX <= _this.offsetL) {
            _this.curPointX = _this.offsetL;
        }
        if (_this.curPointX >= (_this.width - _this.offsetR)) {
            _this.curPointX = _this.width - _this.offsetR;
        }
        _this.draw();
        if (_mouseMoveFlag) {
            _this.mouseMove();
        }
    }

    // this.container.addEventListener('mousedown', onContainerMouseDown, false);  // mouseDownListener
    this.container.addEventListener('mousemove', onMouseMove, false);   // mouseMoveListener
    // this.container.addEventListener('mouseup', onContainerMouseUp, false);  // mouseUpListener
};

