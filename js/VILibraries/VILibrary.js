/**
 * Created by Fengma on 2016/11/10.
 */

'use strict';

let VILibrary = {REVISION: '1.0'};

VILibrary.InternalFunction = {

    fixNumber: function (num) {

        let strLab;
        if (Math.abs(num) >= 1000) {

            num = num / 1000;
            strLab = num.toFixed(1).toString() + 'k';
        }
        else if (Math.abs(num) < 1000 && Math.abs(num) >= 100) {

            strLab = num.toFixed(0).toString();
        }
        else if (Math.abs(num) < 100 && Math.abs(num) >= 10) {

            if (Math.abs(num) - Math.abs(num).toFixed(0) < 0.01) {

                strLab = num.toFixed(0).toString();
            }
            else {

                strLab = num.toFixed(1).toString();
            }
        }
        else if (Math.abs(num) < 10) {

            if (Math.abs(num) - Math.abs(num).toFixed(0) < 0.01) {

                strLab = num.toFixed(0).toString();
            }
            else {

                strLab = num.toFixed(2).toString();
            }
        }
        return strLab;
    },

    getDomObject: function (obj) {
        obj = typeof obj === "string" ? document.getElementById(obj) : obj;
        return (obj instanceof HTMLElement) ? obj : (obj instanceof jQuery) ? obj[0] : false;
    },

    /**
     * FFT算法
     * @param dir
     * @param m 采样点数，多余输入数据时剩余部分置0
     * @param realPart
     * @param imgPart   对于实数据时留空
     * @returns {Array}
     */
    fft: function (dir, m, realPart, imgPart) {

        let n, i, i1, j, k, i2, l, l1, l2, c1, c2, tx, ty, t1, t2, u1, u2, z;
        n = 1;
        for (i = 0; i < m; i += 1) {

            n *= 2;
        }
        let real = realPart.slice(0);
        let img;
        if (imgPart === undefined) {

            img = [];
            for (i = 0; i < n; i += 1) {
                img.push(0);
            }
        }
        else {

            img = imgPart.slice(0);
        }

        /* Do the bit reversal */
        i2 = n >> 1;
        j = 0;
        for (i = 0; i < n - 1; i += 1) {
            if (i < j) {
                tx = real[i];
                ty = img[i];
                real[i] = real[j];
                img[i] = img[j];
                real[j] = tx;
                img[j] = ty;
            }
            k = i2;
            while (k <= j) {
                j -= k;
                k >>= 1;
            }
            j += k;
        }
        /* Compute the FFT */
        c1 = -1.0;
        c2 = 0.0;
        l2 = 1;
        for (l = 0; l < m; l += 1) {
            l1 = l2;
            l2 <<= 1;
            u1 = 1.0;
            u2 = 0.0;
            for (j = 0; j < l1; j += 1) {
                for (i = j; i < n; i += l2) {
                    i1 = i + l1;
                    t1 = u1 * real[i1] - u2 * img[i1];
                    t2 = u1 * img[i1] + u2 * real[i1];
                    real[i1] = real[i] - t1;
                    img[i1] = img[i] - t2;
                    real[i] += t1;
                    img[i] += t2;
                }
                z = u1 * c1 - u2 * c2;
                u2 = u1 * c2 + u2 * c1;
                u1 = z;
            }
            c2 = Math.sqrt((1.0 - c1) * 0.5);
            if (dir === 1) {

                c2 = -c2;
            }
            c1 = Math.sqrt((1.0 + c1) * 0.5);
        }
        /* Scaling for forward transform */
        if (dir === 1) {
            for (i = 0; i < n; i += 1) {
                real[i] /= n;
                img[i] /= n;
            }
        }

        let output = [];
        for (i = 0; i < n / 2; i += 1) {

            output[i] = 2 * Math.sqrt(real[i] * real[i] + img[i] * img[i]);
        }
        return output;
    }
};

VILibrary.VI = {

    AddVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = domElement.getContext('2d');
            this.name = 'AddVI';
            this.zoomValue = 1;

            this.dataLength = 1024;
            this.index = 0;
            this.originalInput = 0;
            this.latestInput = 0;
            this.singleOutput = 0;
            this.output = [0];

            this.outputPointCount = -1;
            this.inputPointCount = 2;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //多输入选择弹出框
            this.inputBoxTitle = '请选择' + this.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            this.inputBoxContent = '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radio-input" name="input-type" value="1" alt="初值" onclick="I.close()">' +
                '<label class="input-label" for="type1">初值</label></div>' +
                '<div><input type="radio" id="type2" class="radio-input" name="input-type" value="2" alt="反馈值" onclick="I.close()">' +
                '<label class="input-label" for="type2">反馈值</label></div></div>';

            //VI双击弹出框
            this.boxTitle = '请输入初始值';
            this.boxContent = '<div class="input-div"><span class="normal-span">初值:</span>' +
                '<input type="number" id="AddVI-input" value="' + this.originalInput + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input, inputType) {

                let inputValue = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(inputValue)) {

                    console.log('AddVI: Input value error');
                    return false;
                }

                if (inputType === 1) {

                    _this.originalInput = inputValue;
                    return true;
                }
                else {

                    _this.latestInput = inputValue;
                    _this.singleOutput = parseFloat(_this.originalInput - _this.latestInput).toFixed(2);

                    let i = 0;
                    if (_this.index <= (_this.dataLength - 1)) {

                        _this.output[_this.index] = _this.singleOutput;
                        _this.index += 1;
                    }
                    else {

                        for (i = 0; i < _this.dataLength - 1; i += 1) {

                            _this.output[i] = _this.output[i + 1];
                        }
                        _this.output[_this.dataLength - 1] = _this.singleOutput;
                    }

                    return _this.singleOutput;
                }
            };

            this.setInitialData = function () {

                _this.originalInput = Number($('#AddVI-input').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {
                    return _this.output;
                }
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

        },
        cnName: '加法器',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    AudioVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = domElement.getContext('2d');
            this.name = 'AudioVI';
            this.zoomValue = 1;

            this.fillStyle = 'silver';
            this.runningFlag = false;

            this.dataLength = 2048;
            this.output = [0];
            this.outputPointCount = -1;
            this.inputPointCount = 0;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.target = [];

            let img = new Image();
            this.draw = function () {

                new Promise(function (resolve, reject) {

                    img.src = 'img/mic.png';
                    img.onload = resolve;
                }).then(function () {

                    _this.ctx.fillStyle = _this.fillStyle;
                    _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
                    _this.ctx.drawImage(img, 0, 0, _this.container.width, _this.container.height);
                });
            };

            this.draw();

            let audioCtx = new (window.AudioContext || webkitAudioContext)(),
                source, analyser = audioCtx.createAnalyser(), animationNumber;
            window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
                || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

            function start () {
                // Older browsers might not implement mediaDevices at all, so we set an empty object first
                if (navigator.mediaDevices === undefined) {
                    navigator.mediaDevices = {};
                }

                // Some browsers partially implement mediaDevices. We can't just assign an object
                // with getUserMedia as it would overwrite existing properties.
                // Here, we will just add the getUserMedia property if it's missing.
                if (navigator.mediaDevices.getUserMedia === undefined) {
                    navigator.mediaDevices.getUserMedia = function (constraints) {

                        // First get ahold of the legacy getUserMedia, if present
                        let getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);

                        // Some browsers just don't implement it - return a rejected promise with an error
                        // to keep a consistent interface
                        if (!getUserMedia) {
                            return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                        }

                        // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
                        return new Promise(function (resolve, reject) {
                            getUserMedia.call(navigator, constraints, resolve, reject);
                        });
                    };
                }

                navigator.mediaDevices.getUserMedia({audio: true}).then(function (stream) {
                        console.log('AudioVI: getUserMedia supported.');

                        //音频输出
                        source = audioCtx.createMediaStreamSource(stream);
                        analyser.fftSize = _this.dataLength;
                        let bufferLength = analyser.frequencyBinCount;
                        let dataArray = new Uint8Array(bufferLength);

                        source.connect(analyser);
                        analyser.connect(audioCtx.destination);
                        function getData () {

                            animationNumber = window.requestAnimationFrame(getData);

                            analyser.getByteTimeDomainData(dataArray);
                            _this.output = Array.from(dataArray);
                        }

                        getData();

                        _this.runningFlag = true;
                        _this.fillStyle = 'red';
                        _this.draw();
                    }
                ).catch(function (err) {
                    console.log('AudioVI: ' + err.name + ": " + err.message);
                });
            }

            function stop () {

                //切断音频输出
                analyser.disconnect(audioCtx.destination);
                window.cancelAnimationFrame(animationNumber);
                //停止数据存储
                // mediaRecorder.stop();
                _this.runningFlag = false;
                _this.fillStyle = 'silver';
                _this.draw();
            }

            this.getData = function () {

                return _this.output;
            };

            this.reset = function () {

                _this.output = [0];
            };

            this.container.addEventListener('click', function () {

                if (_this.target.length > 0) {

                    if (!_this.runningFlag) {

                        start();
                    }
                    else {
                        stop();
                    }
                }
            }, false);
        },
        cnName: '麦克风',
        defaultWidth: '80px',
        defaultHeight: '80px'
    },

    BallBeamVI: {

        createVI: function (VICanvas, draw3DFlag) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.name = 'BallBeamVI';
            this.zoomValue = 1;

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

            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //多输出选择弹出框
            this.outputBoxTitle = '请选择' + this.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            this.outputBoxContent = '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radio-input" name="output-type" value="1" onclick="O.close()">' +
                '<label class="input-label" for="type1">反馈角度</label></div>' +
                '<div><input type="radio" id="type2" class="radio-input" name="output-type" value="2" onclick="O.close()">' +
                '<label class="input-label" for="type2">反馈位置</label></div>' +
                '<div><input type="radio" id="type3" class="radio-input" name="output-type" value="3" onclick="O.close()">' +
                '<label class="input-label" for="type3">标记位置</label></div></div>';

            let camera, scene, renderer, controls, markControl, base, beam, ball, mark, loadedFlag = false, position = 0;

            function setPosition (ang, pos) {
                let angle = -ang;//角度为逆时针旋转
                beam.rotation.z = angle;
                ball.rotation.z = angle;
                mark.rotation.z = angle;
                ball.position.y = pos * Math.sin(angle);
                ball.position.x = pos * Math.cos(angle);
                mark.position.y = position * Math.sin(angle);
                mark.position.x = position * Math.cos(angle);
            }

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
                if (_this.index <= (_this.dataLength - 1)) {
                    _this.angelOutput[_this.index] = _this.PIDAngle;
                    _this.positionOutput[_this.index] = _this.PIDPosition;
                    _this.index += 1;
                }
                else {
                    for (i = 0; i < _this.dataLength - 1; i += 1) {
                        _this.angelOutput[i] = _this.angelOutput[i + 1];
                        _this.positionOutput[i] = _this.positionOutput[i + 1];
                    }
                    _this.angelOutput[_this.dataLength - 1] = _this.PIDAngle;
                    _this.positionOutput[_this.dataLength - 1] = _this.PIDPosition;
                }
                setPosition(_this.PIDAngle * Math.PI / 180, _this.PIDPosition);

                return [_this.PIDAngle, _this.PIDPosition];
            };

            function VIDraw () {
                let img = new Image();
                img.src = 'img/BallBeam.png';
                img.onload = function () {

                    _this.ctx.drawImage(img, 0, 0, _this.container.width, _this.container.height);
                };
            }

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

            /**
             * 三维绘图
             */
            function BallBeamDraw () {
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

                scene.add(base);
                scene.add(beam);
                scene.add(ball);
                scene.add(mark);
                markControl.attach(mark);

                ballBeamAnimate();

                // window.addEventListener('resize', function () {
                //
                //     camera.aspect = domElement.clientWidth / domElement.clientHeight;
                //     camera.updateProjectionMatrix();
                //     renderer.setSize(domElement.clientWidth, domElement.clientHeight);
                // });
            }

            function onBallBeamDrag () {

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

            window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
                || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

            function ballBeamAnimate () {

                window.requestAnimationFrame(ballBeamAnimate);
                markControl.update();
                controls.update();
                renderer.render(scene, camera);

            }

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.angelOutput;  //输出角度数组
                }
                if (dataType === 2) {

                    return _this.positionOutput;  //输出位置数组

                }
                if (dataType === 3) {

                    return _this.markPosition;  //输出标记位置
                }
            };

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

                    _this.container = domElement;
                    _this.ctx = domElement.getContext('2d');
                    VIDraw();
                }
            };

            this.draw();

        },
        cnName: '球杆模型',
        defaultWidth: '550px',
        defaultHeight: '300px'
    },

    BarVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'BarVI';
            this.zoomValue = 1;

            //坐标数值//
            this.labelX = [];
            this.maxValY = 100;
            this.minValY = 0;
            this.autoZoom = true;
            this.outputPointCount = 0;
            this.inputPointCount = 1;
            this.endpoints = {};

            this.pointNum = 100;
            this.drawRulerFlag = true;

            //虚拟仪器中相连接的控件VI
            this.source = [];

            //网格矩形四周边距 TOP RIGHT BOTTOM LEFT//
            this.offsetT = 10;
            this.offsetR = 10;
            this.offsetB = 10;
            this.offsetL = 10;
            if ((_this.container.height >= 200) && (_this.container.width >= 200)) {

                _this.offsetB = 35;
                _this.offsetL = 42;
            }
            this.waveWidth = this.container.width - this.offsetL - this.offsetR;
            this.waveHeight = this.container.height - this.offsetT - this.offsetB;
            this.ratioX = this.waveWidth / this.pointNum;
            this.ratioY = this.waveHeight / (this.maxValY - this.minValY);

            //颜色选型//
            this.bgColor = "RGB(255, 255, 255)";
            this.screenColor = 'RGB(255,253,246)';
            this.gridColor = "RGB(204, 204, 204)";
            this.fontColor = "RGB(0, 0, 0)";
            this.signalColor = "RGB(255, 100, 100)";
            this.rulerColor = "RGB(255, 100, 100)";

            //缓冲数组
            this.bufferVal = [];
            this.curPointX = this.offsetL;
            this.curPointY = this.offsetT;

            this.draw = function () {

                _this.drawBackground();
                _this.drawWave();
                if (_this.drawRulerFlag) {

                    _this.drawRuler();
                }
            };

            function drawRec (x, y, w, h) {

                _this.ctx.beginPath();
                _this.ctx.fillStyle = _this.signalColor;
                _this.ctx.fillRect(x, y, w, h);
                _this.ctx.closePath();
            }

            this.drawWave = function () {

                let i, barHeight, x, y;
                //绘制柱状图
                for (i = 0; i < _this.pointNum; i += 1) {

                    x = _this.offsetL + i * _this.ratioX;
                    barHeight = _this.bufferVal[i] * _this.ratioY;
                    y = _this.offsetT + _this.waveHeight - barHeight;
                    drawRec(x + 0.1 * _this.ratioX, y, _this.ratioX * 0.8, barHeight, true);
                }
            };

            this.drawBackground = function () {

                let ctx = _this.ctx;
                //刷背景//
                ctx.beginPath();
                /* 将这个渐变设置为fillStyle */
                // ctx.fillStyle = grad;
                ctx.fillStyle = _this.bgColor;
                ctx.lineWidth = 3;
                ctx.strokeStyle = "RGB(25, 25, 25)";
                ctx.fillRect(0, 0, _this.container.width, _this.container.height);
                ctx.strokeRect(3, 3, _this.container.width - 6, _this.container.height - 6);
                ctx.closePath();

                //画网格矩形边框和填充
                ctx.beginPath();
                ctx.fillStyle = _this.screenColor;
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'RGB(0, 0, 0)';
                ctx.fillRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
                ctx.strokeRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
                ctx.closePath();

                //网格行数
                let nRow = _this.container.height / 50;
                let divY = _this.waveHeight / nRow;

                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.lineCap = "round";
                ctx.strokeStyle = _this.gridColor;

                let i;
                //绘制横向网格线
                for (i = 1; i < nRow; i += 1) {

                    ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
                    ctx.lineTo(_this.container.width - _this.offsetR, divY * i + _this.offsetT);
                }
                ctx.stroke();
                ctx.closePath();

                if ((_this.container.height >= 200) && (_this.container.width >= 200)) {

                    //绘制横纵刻度
                    let scaleYNum = _this.container.height / 50;
                    let scaleXNum = _this.container.width / 50;
                    let scaleYStep = _this.waveHeight / scaleYNum;
                    let scaleXStep = _this.waveWidth / scaleXNum;
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = _this.fontColor;
                    //画纵刻度
                    let k;
                    for (k = 2; k <= scaleYNum; k += 2) {

                        ctx.moveTo(_this.offsetL - 6, _this.offsetT + k * scaleYStep);
                        ctx.lineTo(_this.offsetL, _this.offsetT + k * scaleYStep);

                    }
                    // //画横刻度
                    // for (k = 0; k < scaleXNum; k += 2) {
                    //
                    //
                    //     ctx.moveTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight);
                    //     ctx.lineTo(_this.offsetL + k * scaleXStep, _this.offsetT + _this.waveHeight + 7);
                    //
                    // }
                    ctx.stroke();
                    ctx.closePath();
                    ////////////////画数字字体////////////////
                    ctx.font = "normal 12px Calibri";

                    let valStepX = _this.pointNum / scaleXNum;
                    let valStepY = (_this.maxValY - _this.minValY) / scaleYNum;

                    ctx.fillStyle = _this.fontColor;
                    let temp = 0;
                    if (_this.labelX.length < _this.pointNum) {

                        for (i = 0; i < _this.pointNum; i += 1) {

                            _this.labelX[i] = i;
                        }
                    }
                    //横坐标刻度//
                    for (i = 0; i < scaleXNum; i += 2) {

                        temp = _this.labelX[parseInt(valStepX * i)];
                        ctx.fillText(VILibrary.InternalFunction.fixNumber(temp), _this.offsetL + scaleXStep * i - 9 + _this.ratioX / 2, _this.container.height - 10);
                    }
                    //纵坐标刻度//
                    for (i = 2; i <= scaleYNum; i += 2) {

                        temp = _this.maxValY - valStepY * i;

                        ctx.fillText(VILibrary.InternalFunction.fixNumber(temp), _this.offsetL - 35, _this.offsetT + scaleYStep * i + 5);
                    }
                    ctx.closePath();
                    ctx.save();
                }
            };

            this.drawBackground();

            this.drawRuler = function () {

                //是否缝隙间不绘制标尺
                // if ((_this.curPointX + 0.1 * _this.ratioX - _this.offsetL ) % _this.ratioX < 0.2 * _this.ratioX) {
                //
                //     return;
                // }

                if (_this.curPointX >= (_this.container.width - _this.offsetR)) {
                    return;
                }
                //画标尺//
                _this.ctx.beginPath();
                _this.ctx.lineWidth = 1;
                _this.ctx.lineCap = "round";
                _this.ctx.strokeStyle = _this.rulerColor;
                _this.ctx.font = "normal 14px Calibri";
                _this.ctx.fillStyle = _this.rulerColor;

                //竖标尺//
                _this.ctx.moveTo(_this.curPointX + 0.5, _this.offsetT);
                _this.ctx.lineTo(_this.curPointX + 0.5, _this.container.height - _this.offsetB);
                _this.ctx.stroke();
                let curPointX = parseInt((_this.curPointX - _this.offsetL + _this.ratioX / 2) * _this.pointNum / _this.waveWidth) - 1;
                let curPointY = VILibrary.InternalFunction.fixNumber(_this.bufferVal[curPointX]);
                _this.ctx.fillText('(' + _this.labelX[curPointX] + ',' + curPointY + ')',
                    _this.container.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15);
                _this.ctx.closePath();
            };

            this.reset = function () {

                _this.bufferVal = [];
                _this.drawBackground();
            };

            this.setData = function (data) {

                if (!Array.isArray(data)) {

                    console.log('BarVI: input type error');
                    return false;
                }
                _this.pointNum = data.length > _this.pointNum ? data.length : _this.pointNum;

                let YMax = 0, YMin = 0, i;
                for (i = 0; i < _this.pointNum; i += 1) {

                    _this.bufferVal[i] = data[i] == undefined ? 0 : data[i];
                    YMax = YMax < _this.bufferVal[i] ? _this.bufferVal[i] : YMax;
                    YMin = YMin > _this.bufferVal[i] ? _this.bufferVal[i] : YMin;
                }
                if (_this.autoZoom) {

                    _this.setAxisRangY(YMin, 1.2 * YMax);
                }
                _this.ratioX = _this.waveWidth / _this.pointNum;
                _this.ratioY = _this.waveHeight / (_this.maxValY - _this.minValY);
                _this.draw();
            };

            this.setAxisRangY = function (yMin, yMax) {

                _this.minValY = yMin;
                _this.maxValY = yMax;
                _this.drawBackground();
            };

            this.setAxisX = function (labelX) {

                _this.labelX = labelX;
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

            let _mouseOverFlag = false;
            let _mouseOutFlag = false;
            let _dragAndDropFlag = false;
            let _mouseUpFlag = false;
            let _onclickFlag = false;
            let _mouseMoveFlag = false;

            this.dragAndDrop = function () { };// this.container.style.cursor = 'move';
            this.mouseOver = function () { }; // this.container.style.cursor = 'pointer';
            this.mouseOut = function () { }; // this.container.style.cursor = 'auto';
            this.mouseUp = function () { }; // this.container.style.cursor = 'auto';
            this.mouseMove = function () { };
            this.onclick = function () { };

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
                }

            };

            function onMouseMove (event) {

                if (!_this.drawRulerFlag || _this.bufferVal.length == 0) {

                    return;
                }
                _this.curPointX = event.offsetX == undefined ? event.layerX : event.offsetX - 1;
                _this.curPointY = event.offsetY == undefined ? event.layerY : event.offsetY - 1;

                if (_this.curPointX <= _this.offsetL) {

                    _this.curPointX = _this.offsetL;
                }
                if (_this.curPointX >= (_this.container.width - _this.offsetR)) {

                    _this.curPointX = _this.container.width - _this.offsetR;
                }
                _this.draw();
                if (_mouseMoveFlag) {
                    _this.mouseMove();
                }
            }

            this.container.addEventListener('mousemove', onMouseMove, false);   // mouseMoveListener
        },
        cnName: '柱状图',
        defaultWidth: '500px',
        defaultHeight: '250px'
    },

    ButtonVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = domElement.getContext('2d');
            this.name = 'ButtonVI';
            this.zoomValue = 1;

            this.fillStyle = 'silver';
            this.outputPointCount = 0;
            this.inputPointCount = 0;
            this.endpoints = {};

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
        },
        cnName: '按钮',
        defaultWidth: '100px',
        defaultHeight: '50px'
    },

    DCOutputVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = domElement.getContext('2d');
            this.name = 'DCOutputVI';
            this.zoomValue = 1;

            this.dataLength = 1024;
            this.index = 0;
            this.singleOutput = 100;//输出初值
            this.output = [100];
            this.outputPointCount = -1;
            this.inputPointCount = 0;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '请设置输出值';
            this.boxContent = '<div class="input-div"><span class="normal-span">初值:</span>' +
                '<input type="number" id="DCOutputVI-input" value="' + this.singleOutput + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            /**
             * 将输出数保存在数组内
             * @param data singleOutput
             */
            this.setData = function (data) {

                let temp = Array.isArray(data) ? data[data.length - 1] : data;
                if (Number.isNaN(temp)) {

                    return false;
                }

                _this.singleOutput = temp;

                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {

                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
                }
            };

            this.setInitialData = function () {

                _this.setData($('#DCOutputVI-input').val());
            };

            this.reset = function () {

                _this.index = 0;
                _this.singleOutput = 100;//输出初值
                _this.output = [100];
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
        },
        cnName: '直流输出',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    DifferentiationResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'DifferentiationResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '微分响应';
            this.boxContent = '<div class="input-div"><span class="normal-span">K3:</span>' +
                '<input type="number" id="DifferentiationResponseVI-input" value="' + this.k3 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                _this.singleOutput = _this.k3 * (_this.input - _this.lastInput) * _this.Fs;
                _this.lastInput = _this.input;

                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {
                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {
                    for (i = 0; i < _this.dataLength - 1; i += 1) {
                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k3 = Number($('#DifferentiationResponseVI-input').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText('微分', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();

        },
        cnName: '微分响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    FFTVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'FFTVI';
            this.zoomValue = 1;

            this.output = [0];
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            this.setData = function (input) {

                if (!Array.isArray(input)) {

                    return;
                }
                _this.output = VILibrary.InternalFunction.fft(1, 11, input);
                return _this.output;

            };

            this.getData = function () {

                return _this.output;
            };

            this.reset = function () {

                _this.output = [0];
            };

            this.draw = function () {
                _this.ctx.font = 'normal 12px Microsoft YaHei';
                _this.ctx.fillStyle = 'orange';
                _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
                _this.ctx.fillStyle = 'black';
                _this.ctx.fillText('FFT', _this.container.width / 2 - 11, _this.container.height / 2 + 6);
            };
            this.draw();

        },
        cnName: 'FFT',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    InertiaResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'InertiaResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '惯性响应';
            this.boxContent = '<div class="input-div"><span class="normal-span">K1:</span>' +
                '<input type="number" id="InertiaResponseVI-input" value="' + this.k1 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                let v, E;

                //一阶 1/(TS+1)
                E = Math.exp(-1 / (_this.k1 * _this.Fs));
                v = E * _this.temp1 + (1.0 - E) * _this.input;
                _this.temp1 = v;
                _this.singleOutput = v;//输出

                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {
                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {
                    for (i = 0; i < _this.dataLength - 1; i += 1) {
                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k1 = Number($('#InertiaResponseVI-input').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
                }
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

        },
        cnName: '惯性响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    IntegrationResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'IntegrationResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '积分响应';
            this.boxContent = '<div class="input-div"><span class="normal-span">K2:</span>' +
                '<input type="number" id="IntegrationResponseVI-input" value="' + this.k2 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                let v2, v21;

                v21 = _this.temp1 + 0.5 * (_this.input + _this.lastInput) / _this.Fs;
                _this.temp1 = v21;
                v2 = _this.k2 * v21;

                _this.singleOutput = v2;
                _this.lastInput = _this.input;

                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {
                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {
                    for (i = 0; i < _this.dataLength - 1; i += 1) {
                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k2 = Number($('#IntegrationResponseVI-input').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText('积分', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();
        },
        cnName: '积分响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    KnobVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'KnobVI';
            this.zoomValue = 1;

            this.minValue = 0;
            this.maxValue = 100;
            this.defaultValue = 100;
            this.ratio = (this.maxValue - this.minValue) / (Math.PI * 1.5);
            this.singleOutput = this.defaultValue;
            this.radian = (this.defaultValue - this.minValue) / this.ratio;

            this.dataLength = 1024;
            this.index = 0;
            this.output = [100];
            this.outputPointCount = -1;
            this.inputPointCount = 0;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '请输入初始值';
            this.boxContent = '<div class="input-div">' +
                '<span class="normal-span">最小值:</span><input type="number" id="KnobVI-input-1" value="' + this.minValue + '" class="normal-input">' +
                '<span class="normal-span">最大值:</span><input type="number" id="KnobVI-input-2" value="' + this.maxValue + '" class="normal-input">' +
                '<span class="normal-span">初值:</span><input type="number" id="KnobVI-input-3" value="' + this.defaultValue + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            let spinnerFlag = false;
            let startX, startY, stopX, stopY;
            let roundCount = 0;
            let knob_Base = new Image(), knob_Spinner = new Image();

            let p1 = new Promise(function (resolve, reject) {

                knob_Base.src = "img/knob_Base.png";
                knob_Base.onload = resolve;
                knob_Base.onerror = reject;
            });
            let p2 = new Promise(function (resolve, reject) {

                knob_Spinner.src = "img/knob_Spinner.png";
                knob_Spinner.onload = resolve;
                knob_Spinner.onerror = reject;
            });
            Promise.all([p1, p2]).then(function () { _this.draw(); })
                   .catch(function (e) { console.log('KnobVI: Error:' + e); });

            /**
             *设置旋钮初始参数
             * @param minValue  最小值
             * @param maxValue  最大值
             * @param startValue  初值
             */
            this.setDataRange = function (minValue, maxValue, startValue) {

                let minVal = Number.isNaN(minValue) ? 0 : minValue;
                let maxVal = Number.isNaN(maxValue) ? 1 : maxValue;
                let startVal = Number.isNaN(startValue) ? 0 : startValue;
                if (minVal >= maxVal || startVal < minVal || startVal > maxVal) {

                    console.log('KnobVI: DataRange set error!');
                    return false;
                }

                _this.minValue = minVal;
                _this.maxValue = maxVal;
                _this.defaultValue = startVal;

                _this.ratio = (_this.maxValue - _this.minValue) / (Math.PI * 1.5);
                this.setData(_this.defaultValue);
                this.radian = (_this.defaultValue - _this.minValue) / _this.ratio;

                _this.draw();
            };

            this.setData = function (data) {

                if (Number.isNaN(data)) {

                    console.log('KnobVI: Not a number!');
                    return false;
                }
                if (data < _this.minValue || data > _this.maxValue) {

                    console.log('KnobVI: Out of range!');
                    return false;
                }
                _this.singleOutput = data;

                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {
                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }
            };

            this.setInitialData = function () {

                let minValue = Number($('#KnobVI-input-1').val());
                let maxValue = Number($('#KnobVI-input-2').val());
                let defaultValue = Number($('#KnobVI-input-3').val());
                _this.setDataRange(minValue, maxValue, defaultValue);
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
                }
            };

            this.reset = function () {

                _this.index = 0;
                _this.singleOutput = _this.defaultValue;
                _this.output = [100];
            };

            this.draw = function () {

                let xPos = _this.container.width / 2;
                let yPos = _this.container.height / 2;
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

            let _mouseOverFlag = false;
            let _mouseOutFlag = false;
            let _dragAndDropFlag = false;
            let _mouseUpFlag = false;
            let _onclickFlag = false;
            let _mouseMoveFlag = false;

            this.dragAndDrop = function () { };// this.container.style.cursor = 'move';
            this.mouseOver = function () { }; // this.container.style.cursor = 'pointer';
            this.mouseOut = function () { }; // this.container.style.cursor = 'auto';
            this.mouseUp = function () { }; // this.container.style.cursor = 'auto';
            this.mouseMove = function () { };
            this.onclick = function () { };

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
                }

            };

            function onMouseDown (event) {

                let tempData = rotateAxis(event.offsetX - _this.container.width / 2, -(event.offsetY - _this.container.height / 2), 135);
                startX = tempData[0];
                startY = tempData[1];
                if ((startX * startX + startY * startY) <= _this.container.width / 2 * _this.container.width / 2 * 0.5) {

                    spinnerFlag = true;
                }

            }

            function onMouseMove (event) {

                let tempData = rotateAxis(event.offsetX - _this.container.width / 2, -(event.offsetY - _this.container.height / 2), 135);
                stopX = tempData[0];
                stopY = tempData[1];
                if ((stopX * stopX + stopY * stopY) <= _this.container.width / 2 * _this.container.width / 2 * 0.5 && !spinnerFlag) {
                    _this.container.style.cursor = 'pointer';
                }
                else if (!spinnerFlag) {
                    _this.container.style.cursor = 'auto';
                }
                if (spinnerFlag) {

                    if (startY > 0 && stopY > 0) {
                        if (startX < 0 && stopX >= 0) {
                            roundCount += 1;
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

            function onMouseUp (event) {

                spinnerFlag = false;
                roundCount = 0;

                if (_mouseUpFlag) {

                    _this.mouseUp();
                }
            }

            function calculateRadian (x1, y1, x2, y2) {
                // 直角的边长
                let x = x2 - x1;
                let y = y2 - y1;
                // 斜边长
                let z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                // 余弦
                let cos = y / z;
                // 弧度
                let radian;
                if (x >= 0) {
                    radian = Math.acos(cos);
                }
                else {
                    radian = Math.PI * 2 - Math.acos(cos);
                }
                return radian;
            }

            /**
             * 坐标系转换
             * @param x
             * @param y
             * @param angle
             * @returns {[x1, y1]}
             */
            function rotateAxis (x, y, angle) {
                let radian = angle / 180 * Math.PI;
                return [Math.sin(radian) * y + Math.cos(radian) * x, Math.cos(radian) * y - Math.sin(radian) * x];
            }

            this.container.addEventListener('mousemove', onMouseMove, false);
            this.container.addEventListener('mousedown', onMouseDown, false);
            this.container.addEventListener('mouseup', onMouseUp, false);
        },
        cnName: '旋钮',
        defaultWidth: '150px',
        defaultHeight: '150px'
    },

    OrbitWaveVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'OrbitWaveVI';
            this.zoomValue = 1;

            //坐标单位//
            this.strLabelX = 'X';
            this.strLabelY = 'Y';

            //坐标数值//
            this.MaxVal = 20;
            this.MinVal = -20;
            this.autoZoom = true;
            this.outputPointCount = 0;
            this.inputPointCount = 1;
            this.endpoints = {};

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
            if ((_this.container.height >= 200) && (_this.container.width >= 200)) {

                _this.offsetB = 25 + _this.borderWidth;
                _this.offsetL = 38 + _this.borderWidth;
            }
            this.waveWidth = this.container.width - this.offsetL - this.offsetR;
            this.waveHeight = this.container.height - this.offsetT - this.offsetB;

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

                let ratioX = _this.waveWidth / (_this.MaxVal - _this.MinVal);
                let ratioY = _this.waveHeight / (_this.MaxVal - _this.MinVal);
                let pointX = [];
                let pointY = [];

                let i;
                for (i = 0; i < _this.pointNum; i += 1) {

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
                for (i = 1; i < _this.pointNum; i += 1) {

                    _this.ctx.moveTo(pointX[i - 1], pointY[i - 1]);
                    _this.ctx.lineTo(pointX[i], pointY[i]);
                }
                _this.ctx.stroke();
                _this.ctx.closePath();
                _this.ctx.save();
            };

            this.drawBackground = function () {

                let ctx = _this.ctx;
                //刷背景//
                ctx.beginPath();
                /* 将这个渐变设置为fillStyle */
                // ctx.fillStyle = grad;
                ctx.fillStyle = _this.bgColor;
                ctx.lineWidth = 3;
                ctx.strokeStyle = "RGB(25, 25, 25)";
                ctx.fillRect(0, 0, _this.container.width, _this.container.height);
                ctx.strokeRect(3, 3, _this.container.width - 6, _this.container.height - 6);
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

                let nRow = _this.nRow;
                let nCol = _this.nCol;
                let divX = _this.waveWidth / nCol;
                let divY = _this.waveHeight / nRow;
                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.lineCap = "round";
                ctx.strokeStyle = _this.gridColor;

                let i, j;
                //绘制横向网格线
                for (i = 1; i < nRow; i += 1) {
                    if (i == 4) {

                        ctx.lineWidth = 10;
                    }
                    else {

                        ctx.lineWidth = 1;
                    }
                    ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
                    ctx.lineTo(_this.container.width - _this.offsetR, divY * i + _this.offsetT);
                }
                //绘制纵向网格线
                for (j = 1; j < nCol; j += 1) {

                    if (i == 4) {

                        ctx.lineWidth = 10;
                    }
                    else {

                        ctx.lineWidth = 1;
                    }
                    ctx.moveTo(divX * j + _this.offsetL, _this.offsetT);
                    ctx.lineTo(divX * j + _this.offsetL, _this.container.height - _this.offsetB);
                }
                ctx.stroke();
                ctx.closePath();
                //////////////////////////////////////////////////////

                if ((_this.container.height >= 200) && (_this.container.width >= 200)) {
                    //绘制横纵刻度
                    let scaleYNum = 20;
                    let scaleXNum = 20;
                    let scaleYStep = _this.waveHeight / scaleYNum;
                    let scaleXStep = _this.waveWidth / scaleXNum;
                    ////////////////画数字字体////////////////
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = _this.fontColor;
                    ctx.font = "normal 14px Calibri";

                    let xValStep = (_this.MaxVal - _this.MinVal) / scaleXNum;
                    let yValStep = (_this.MaxVal - _this.MinVal) / scaleYNum;

                    ctx.fillStyle = _this.fontColor;
                    let temp = 0;
                    //横坐标刻度//
                    for (i = 2; i < scaleXNum; i += 4) {

                        temp = _this.MinVal + xValStep * i;
                        ctx.fillText(VILibrary.InternalFunction.fixNumber(temp), _this.offsetL + scaleXStep * i - 9, _this.container.height - 10);
                    }
                    //纵坐标刻度//
                    for (i = 2; i < scaleYNum; i += 4) {

                        temp = _this.MaxVal - yValStep * i;
                        ctx.fillText(VILibrary.InternalFunction.fixNumber(temp), _this.offsetL - 30, _this.offsetT + scaleYStep * i + 5);
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
                _this.ctx.lineTo(_this.curPointX + 0.5, _this.container.height - _this.offsetB);
                _this.ctx.stroke();
                let i;
                let curPointX = parseFloat((_this.curPointX - _this.offsetL) * (_this.MaxVal - _this.MinVal) / _this.waveWidth + _this.MinVal)
                .toFixed(1);
                let curPointY = [];
                for (i = 0; i < _this.pointNum; i += 1) {

                    if (parseFloat(_this.bufferValX[i]).toFixed(1) === curPointX) {

                        curPointY.push(parseFloat(_this.bufferValY[i]).toFixed(1));
                        if (curPointY.length >= 5) {

                            break;
                        }
                    }
                }
                for (i = 0; i < curPointY.length; i += 1) {

                    _this.ctx.fillText('(' + curPointX + ', ' + curPointY[i] + ')',
                        _this.container.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15 + i * 15);
                }
                _this.ctx.closePath();
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

            this.setData = function (input) {

                let dataX = input[0];
                let dataY = input[1];
                if ((dataX == null || undefined) || (dataY == null || undefined)) {

                    return false;
                }

                _this.pointNum = dataX.length > dataY.length ? dataY.length : dataX.length; //取较短的数据长度
                if (Number.isNaN(_this.pointNum)) {

                    return false;
                }
                let XMax = 0, XMin = 0, YMax = 0, YMin = 0;
                let i;
                for (i = 0; i < _this.pointNum; i += 1) {

                    _this.bufferValY[i] = dataY[i] == undefined ? 0 : dataY[i];
                    YMax = YMax < _this.bufferValY[i] ? _this.bufferValY[i] : YMax;
                    YMin = YMin > _this.bufferValY[i] ? _this.bufferValY[i] : YMin;
                }
                for (i = 0; i < _this.pointNum; i += 1) {

                    _this.bufferValX[i] = dataX[i] == undefined ? 0 : dataX[i];
                    XMax = XMax < _this.bufferValX[i] ? _this.bufferValX[i] : XMax;
                    XMin = XMin > _this.bufferValX[i] ? _this.bufferValX[i] : XMin;
                }
                if (_this.autoZoom) {

                    let XYMax = YMax > XMax ? YMax : XMax;
                    let XYMin = YMin > XMin ? XMin : YMin;
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

            this.reset = function () {
                let i;
                for (i = 0; i < _this.pointNum; i += 1) {

                    _this.bufferValY[i] = 0.0;
                    _this.bufferValX[i] = 0.0;
                }
                _this.drawBackground();
            };

            let _mouseOverFlag = false;
            let _mouseOutFlag = false;
            let _dragAndDropFlag = false;
            let _mouseUpFlag = false;
            let _onclickFlag = false;
            let _mouseMoveFlag = false;

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
                }

            };

            function onMouseMove (event) {

                if (!_this.drawRulerFlag || _this.bufferValY.length == 0) {

                    return;
                }
                _this.curPointX = event.offsetX == undefined ? event.layerX : event.offsetX - 5;
                _this.curPointY = event.offsetY == undefined ? event.layerY : event.offsetY - 5;

                if (_this.curPointX <= _this.offsetL) {
                    _this.curPointX = _this.offsetL;
                }
                if (_this.curPointX >= (_this.container.width - _this.offsetR)) {
                    _this.curPointX = _this.container.width - _this.offsetR;
                }
                _this.draw();
            }

            this.container.addEventListener('mousemove', onMouseMove, false);   // mouseMoveListener
        },
        cnName: '二维波形',
        defaultWidth: '400px',
        defaultHeight: '370px'
    },

    OscillationResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'OscillationResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '震荡响应';
            this.boxContent = '<div class="input-div">' +
                '<span class="normal-span">K1:</span><input type="number" id="OscillationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
                '<span class="normal-span">K2:</span><input type="number" id="OscillationResponseVI-input-2" value="' + this.k2 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                let v, a1, b1;

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
                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {
                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {
                    for (i = 0; i < _this.dataLength - 1; i += 1) {
                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k1 = Number($('#OscillationResponseVI-input-1').val());
                _this.k2 = Number($('#OscillationResponseVI-input-2').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText('震荡', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();
        },
        cnName: '震荡响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    PIDVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext('2d');
            this.name = 'PIDVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '请输入PID参数';
            this.boxContent = '<div class="input-div">' +
                '<span class="normal-span">P:</span><input type="number" id="PIDVI-input-1" value="' + this.P + '" class="normal-input">' +
                '<span class="normal-span">I:</span><input type="number" id="PIDVI-input-2" value="' + this.I + '" class="normal-input">' +
                '<span class="normal-span">D:</span><input type="number" id="PIDVI-input-3" value="' + this.D + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            /**
             *
             * @param input 从输入端读取的数据
             */
            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                let v1, v2, v3, v21;

                v1 = _this.P * _this.input;

                v21 = _this.temp1 + 0.5 * (Number(_this.input) + Number(_this.lastInput)) / _this.Fs;
                _this.temp1 = v21;
                v2 = _this.I * v21;

                v3 = _this.D * (_this.input - _this.lastInput) * _this.Fs;

                _this.lastInput = _this.input;
                _this.singleOutput = v1 + v2 + v3;

                //将输出数保存在数组内
                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {

                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;
            };

            this.setInitialData = function () {

                _this.P = Number($('#PIDVI-input-1').val());
                _this.I = Number($('#PIDVI-input-2').val());
                _this.D = Number($('#PIDVI-input-3').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
                }
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
        },
        cnName: 'PID控制器',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    ProportionDifferentiationResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'ProportionDifferentiationResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '比例微分响应';
            this.boxContent = '<div class="input-div">' +
                '<span class="normal-span">K1:</span><input type="number" id="ProportionDifferentiationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
                '<span class="normal-span">K3:</span><input type="number" id="ProportionDifferentiationResponseVI-input-2" value="' + this.k3 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                let v1, v3;

                v1 = _this.k1 * _this.input;

                v3 = _this.k3 * (_this.input - _this.lastInput) * _this.Fs;

                _this.singleOutput = v1 + v3;
                _this.lastInput = _this.input;

                //将输出数保存在数组内
                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {

                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k1 = Number($('#ProportionDifferentiationResponseVI-input-1').val());
                _this.k3 = Number($('#ProportionDifferentiationResponseVI-input-2').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText('微分', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();
        },
        cnName: '比例微分响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    ProportionInertiaResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'ProportionInertiaResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '比例惯性响应';
            this.boxContent = '<div class="input-div">' +
                '<span class="normal-span">K1:</span><input type="number" id="ProportionInertiaResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
                '<span class="normal-span">K2:</span><input type="number" id="ProportionInertiaResponseVI-input-2" value="' + this.k2 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                let v, E;

                //一阶 X+1/(TS+1)
                E = Math.exp(-1 / (_this.k1 * _this.Fs));
                v = E * _this.temp1 + (1.0 - E) * _this.input;
                _this.temp1 = v;
                _this.singleOutput = v + _this.k2 * _this.input;//输出

                //将输出数保存在数组内
                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {

                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k1 = Number($('#ProportionInertiaResponseVI-input-1').val());
                _this.k2 = Number($('#ProportionInertiaResponseVI-input-2').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText('惯性', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();
        },
        cnName: '比例惯性响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    ProportionIntegrationResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'ProportionIntegrationResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '比例积分响应';
            this.boxContent = '<div class="input-div">' +
                '<span class="normal-span">K1:</span><input type="number" id="ProportionIntegrationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
                '<span class="normal-span">K2:</span><input type="number" id="ProportionIntegrationResponseVI-input-2" value="' + this.k2 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                let v1, v2, v21;

                if (_this.signalType < 6) {
                    v1 = _this.k1 * _this.input;

                    v21 = _this.temp1 + 0.5 * (_this.input + _this.lastInput) / _this.Fs;
                    _this.temp1 = v21;
                    v2 = _this.k2 * v21;

                    _this.singleOutput = v1 + v2;
                    _this.lastInput = _this.input;
                }

                //将输出数保存在数组内
                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {

                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k1 = Number($('#ProportionIntegrationResponseVI-input-1').val());
                _this.k2 = Number($('#ProportionIntegrationResponseVI-input-2').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText('积分', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();
        },
        cnName: '比例积分响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    ProportionResponseVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'ProportionResponseVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //VI双击弹出框
            this.boxTitle = '比例响应';
            this.boxContent = '<div class="input-div"><span class="normal-span">K1:</span>' +
                '<input type="number" id="ProportionResponseVI-input" value="' + this.k1 + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }

                _this.singleOutput = _this.k1 * _this.input;

                //将输出数保存在数组内
                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {

                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }

                return _this.singleOutput;

            };

            this.setInitialData = function () {

                _this.k1 = Number($('#ProportionResponseVI-input').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText('比例', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();
        },
        cnName: '比例响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    RelayVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = domElement.getContext('2d');
            this.name = 'RelayVI';
            this.zoomValue = 1;

            this.input = 0;
            this.singleOutput = 0;
            this.dataLength = 1024;
            this.index = 0;
            this.output = [0];
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }
                _this.singleOutput = _this.input;

                let i = 0;
                if (_this.index <= (_this.dataLength - 1)) {

                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {

                    for (i = 0; i < _this.dataLength - 1; i += 1) {

                        _this.output[i] = _this.output[i + 1];
                    }
                    _this.output[_this.dataLength - 1] = _this.singleOutput;
                }
                return _this.singleOutput;
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
                }
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
                _this.ctx.fillText(VILibrary.VI.RelayVI.cnName, _this.container.width / 2 - 18, _this.container.height / 2 + 6);
            };

            this.draw();
        },
        cnName: '存储器',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    RotorExperimentalRigVI: {

        createVI: function (VICanvas, draw3DFlag) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.name = 'RotorExperimentalRigVI';
            this.zoomValue = 1;
            this.isStart = false;

            this.signalType = 1;
            this.rotateSpeed = 4096;
            this.dataLength = 2048;
            this.index = 0;
            this.rotateFrequency = 4096 / 60;  //旋转频率
            this.signalOutput = [0];
            this.frequencyOutput = [0];
            this.orbitXOutput = [0];
            this.orbitYOutput = [0];

            this.outputPointCount = -1;
            this.inputPointCount = 0;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //多输出选择弹出框
            this.outputBoxTitle = '请选择' + this.cnText + '输出参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            this.outputBoxContent = '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radio-input" name="output-type" value="1" onclick="O.close()">' +
                '<label class="input-label" for="type1">时域信号</label></div>' +
                '<div><input type="radio" id="type2" class="radio-input" name="output-type" value="2" onclick="O.close()">' +
                '<label class="input-label" for="type2">频域信号</label></div>' +
                '<div><input type="radio" id="type3" class="radio-input" name="output-type" value="3" onclick="O.close()">' +
                '<label class="input-label" for="type3">轴心轨迹</label></div>' +
                '<div><input type="radio" id="type4" class="radio-input" name="output-type" value="4" onclick="O.close()">' +
                '<label class="input-label" for="type4">旋转频率</label></div></div>';

            //VI双击弹出框
            this.boxTitle = '请设置输出信号类型';
            this.boxContent = '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radio-input" name="RotorExperimentalRigVI-type" value="1" onclick="B.close()">' +
                '<label class="input-label" for="type1">转速信号</label></div>' +
                '<div><input type="radio" id="type2" class="radio-input" name="RotorExperimentalRigVI-type" value="2" onclick="B.close()">' +
                '<label class="input-label" for="type2">加速度信号</label></div>' +
                '<div><input type="radio" id="type3" class="radio-input" name="RotorExperimentalRigVI-type" value="3" onclick="B.close()">' +
                '<label class="input-label" for="type3">轴心位移X信号</label></div>' +
                '<div><input type="radio" id="type4" class="radio-input" name="RotorExperimentalRigVI-type" value="4" onclick="B.close()">' +
                '<label class="input-label" for="type4">轴心位移Y信号</label></div></div>';

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

            this.setInitialData = function () {

                _this.signalType = Number($('input[name=RotorExperimentalRigVI-type]:checked').val());
            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.signalOutput;  //输出时域信号

                }
                if (dataType === 2) {

                    return _this.frequencyOutput;  //输出频域信号

                }
                if (dataType === 3) {

                    return [_this.orbitXOutput, _this.orbitYOutput];  //输出轴心位置

                }
                if (dataType === 4) {

                    return _this.rotateFrequency;  //输出旋转频率

                }
            };

            function VIDraw () {

                let img = new Image();
                img.src = 'img/RotorExperimentalRig.png';
                img.onload = function () {

                    _this.ctx.drawImage(img, 0, 0, _this.container.width, _this.container.height);
                };
            }

            let camera, scene, renderer, controls, base, rotor, offSwitch, onSwitch, switchControl, loadedFlag = false,
                timer1, timer2, phase = 0, sampleFrequency = 8192, dt = 1 / sampleFrequency;

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
            window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
                || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
            function rotorAnimate () {

                window.requestAnimationFrame(rotorAnimate);
                switchControl.update();
                controls.update();
                renderer.render(scene, camera);

            }

            function generateData () {

                let i;
                for (i = 0; i < _this.dataLength; i += 1) {

                    _this.orbitXOutput[i] = 7.5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * phase / 360) +
                        4 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * phase / 360) + 2 * Math.random();
                }
                for (i = 0; i < _this.dataLength; i += 1) {

                    _this.orbitYOutput[i] = 7.5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * (phase + 90) / 360) +
                        4 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * (phase + 90) / 360) + 2 * Math.random();
                }
                if (_this.signalType == 1) {//转速信号    正弦波

                    for (i = 0; i < _this.dataLength; i += 1) {

                        _this.signalOutput[i] = 5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * phase / 360);
                    }
                }
                else if (_this.signalType == 2) {//加速度信号

                    for (i = 0; i < _this.dataLength; i += 1) {

                        _this.signalOutput[i] = 5 * Math.sin(2 * Math.PI * _this.rotateFrequency * i * dt + 2 * Math.PI * phase / 360) +
                            6 * Math.sin(4 * Math.PI * _this.rotateFrequency * i * dt + 4 * Math.PI * phase / 360) + 2 * Math.random();
                    }
                }
                else if (_this.signalType == 3) {//位移X信号

                    for (i = 0; i < _this.dataLength; i += 1) {

                        _this.signalOutput[i] = _this.orbitXOutput[i];
                    }
                }
                else if (_this.signalType == 4) {//位移Y信号

                    for (i = 0; i < _this.dataLength; i += 1) {

                        _this.signalOutput[i] = _this.orbitYOutput[i];
                    }
                }
                _this.frequencyOutput = VILibrary.InternalFunction.fft(1, 11, _this.signalOutput);
            }

            /**
             * 三维绘图
             * @constructor
             */
            function RotorExperimentalRigDraw () {

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

                    let timer = window.setInterval(function () {
                        if (loadedFlag) {

                            new RotorExperimentalRigDraw();
                            window.clearInterval(timer);
                        }
                    }, 100);
                }
                else {

                    _this.container = domElement;
                    _this.ctx = domElement.getContext('2d');
                    VIDraw();
                }
            };
            this.draw();
        },
        cnName: '转子实验台',
        defaultWidth: '550px',
        defaultHeight: '300px'
    },

    RoundPanelVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext('2d');
            this.name = 'RoundPanelVI';
            this.zoomValue = 1;

            this.latestInput = 0;
            this.handAngle = Math.PI * 5 / 6;
            this.panelRangeAngle = Math.PI * 4 / 3;

            this.minValue = 0;
            this.maxValue = 100;
            this.bigSectionNum = 10;
            this.smallSectionNum = 10;
            this.unit = '';
            this.title = '';
            this.outputPointCount = 0;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];

            //VI双击弹出框
            this.boxTitle = '请设置初始参数';
            this.boxContent = '<div class="input-div">' +
                '<span class="normal-span">标题:</span><input type="text" id="RoundPanelVI-input-1" value="' + this.title + '" class="normal-input">' +
                '<span class="normal-span">单位:</span><input type="text" id="RoundPanelVI-input-2" value="' + this.unit + '" class="normal-input">' +
                '<span class="normal-span">最小值:</span><input type="number" id="RoundPanelVI-input-3" value="' + this.minValue + '" class="normal-input">' +
                '<span class="normal-span">最大值:</span><input type="number" id="RoundPanelVI-input-4" value="' + this.maxValue + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.bgColor = "RGB(249, 250, 249)";
            this.screenColor = "RGB(61, 132, 185)";
            this.borderColor = "RGB(100,100,100)";
            this.fontColor = "RGB(0, 0, 0)";
            this.fontSize = parseInt(16 * _this.radius / 150);

            this.R = _this.container.width > _this.container.height ? _this.container.height / 2 : _this.container.width / 2;
            this.radius = this.R * 0.9;

            function parsePosition (angle) {

                let position = [];
                position[0] = _this.radius * 0.82 * Math.cos(angle);
                position[1] = _this.radius * 0.82 * Math.sin(angle);
                return position;
            }

            function dataFormation (data) {

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

                minVal = Array.isArray(minVal) ? minVal[minVal.length - 1] : minVal;
                if (Number.isNaN(minVal)) {

                    return false;
                }
                maxVal = Array.isArray(maxVal) ? maxVal[maxVal.length - 1] : maxVal;
                if (Number.isNaN(maxVal)) {

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

                _this.latestInput = Array.isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
                if (Number.isNaN(_this.latestInput)) {

                    return false;
                }
                _this.latestInput = _this.latestInput < _this.minValue ? _this.minValue : _this.latestInput;
                _this.latestInput = _this.latestInput > _this.maxValue ? _this.maxValue : _this.latestInput;
                _this.latestInput = parseFloat(_this.latestInput).toFixed(2);
                _this.handAngle = Math.PI * 5 / 6 + _this.latestInput / _this.maxValue * _this.panelRangeAngle;
                _this.draw();
            };

            this.setInitialData = function () {

                let title = Number($('#RoundPanelVI-input-1').val());
                let unit = Number($('#RoundPanelVI-input-2').val());
                let minValue = Number($('#RoundPanelVI-input-3').val());
                let maxValue = Number($('#RoundPanelVI-input-4').val());
                _this.setRange(minValue, maxValue, unit, title);
            };

            this.reset = function () {

                _this.latestInput = 0;
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
                let i, j;
                // 保存
                _this.ctx.save();
                // 位移到目标点
                _this.ctx.translate(this.R, this.R);

                let rotateAngle = Math.PI * 5 / 6, position, markStr, fontSize;
                _this.ctx.font = 'normal ' + _this.fontSize / 2 + 'px Microsoft YaHei';
                fontSize = /\d+/.exec(_this.ctx.font)[0];
                for (i = 0; i <= _this.bigSectionNum; i += 1) {

                    _this.ctx.save();
                    _this.ctx.rotate(rotateAngle);
                    _this.ctx.moveTo(_this.radius * 0.99, 0);
                    _this.ctx.lineTo(_this.radius * 0.9, 0);
                    _this.ctx.restore();

                    if (_this.R > 100) {
                        for (j = 1; j < _this.smallSectionNum; j += 1) {

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

        },
        cnName: '圆表盘',
        defaultWidth: '150px',
        defaultHeight: '150px'
    },

    SignalGeneratorVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = domElement.getContext('2d');
            this.name = 'SignalGeneratorVI';
            this.zoomValue = 1;

            this.ampSetFlag = false;
            this.frequencySetFlag = false;

            this.dataLength = 1024;
            this.phase = 0;
            this.amp = 1;
            this.frequency = 256;
            this.signalType = 1;
            this.singleOutput = 0;
            this.output = [0];

            this.outputPointCount = -1;
            this.inputPointCount = 2;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            //多输入选择弹出框
            this.inputBoxTitle = '请选择' + this.cnText + '输入参数&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
            this.inputBoxContent = '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radio-input" name="input-type" value="1" alt="幅值" onclick="I.close()">' +
                '<label class="input-label" for="type1">幅值</label></div>' +
                '<div><input type="radio" id="type2" class="radio-input" name="input-type" value="2" alt="频率" onclick="I.close()">' +
                '<label class="input-label" for="type2">频率</label></div></div>';

            //VI双击弹出框
            this.boxTitle = '请选择信号类型';
            this.boxContent = '<div class="input-div">' +
                '<div><input type="radio" id="type1" class="radio-input" name="SignalGeneratorVI-type" value="1" onclick="B.close()">' +
                '<label class="input-label" for="type1">正弦波</label></div>' +
                '<div><input type="radio" id="type2" class="radio-input" name="SignalGeneratorVI-type" value="2" onclick="B.close()">' +
                '<label class="input-label" for="type2">方波</label></div>' +
                '<div><input type="radio" id="type3" class="radio-input" name="SignalGeneratorVI-type" value="3" onclick="B.close()">' +
                '<label class="input-label" for="type3">三角波</label></div>' +
                '<div><input type="radio" id="type4" class="radio-input" name="SignalGeneratorVI-type" value="4" onclick="B.close()">' +
                '<label class="input-label" for="type4">白噪声</label></div></div>';

            // 采样频率为11025Hz
            this.setData = function (input, inputType) {

                if (inputType === 1) {

                    _this.amp = Array.isArray(input) ? input[input.length - 1] : input;
                    _this.ampSetFlag = true;
                }
                else if (inputType === 2) {

                    _this.frequency = Array.isArray(input) ? input[input.length - 1] : input;
                    _this.frequencySetFlag = true;
                }
                if (_this.ampSetFlag && _this.frequencySetFlag) {

                    _this.ampSetFlag = false;
                    _this.frequencySetFlag = false;
                    if (Number.isNaN(_this.amp) || Number.isNaN(_this.frequency) || Number.isNaN(_this.phase)) {

                        return false;
                    }
                    let FS = 11025;
                    let i, j;
                    let T = 1 / _this.frequency;//周期
                    let dt = 1 / FS;//采样周期
                    let t, t1, t2, t3;

                    if (_this.frequency <= 0) {

                        for (i = 0; i < _this.dataLength; i += 1) {

                            _this.output[i] = 0;
                        }
                        _this.singleOutput = 0;
                        return _this.output;
                    }

                    switch (parseInt(_this.signalType)) {
                        case 1://正弦波
                            for (i = 0; i < _this.dataLength; i += 1) {

                                _this.output[i] = _this.amp * Math.sin(2 * Math.PI * _this.frequency * i * dt + (2 * Math.PI * _this.phase) / 360);
                            }
                            _this.singleOutput = _this.output[_this.dataLength - 1];
                            break;

                        case 2://方波
                            t1 = T / 2;//半周期时长
                            t3 = T * _this.phase / 360.0;
                            for (i = 0; i < _this.dataLength; i += 1) {

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
                            for (i = 0; i < _this.dataLength; i += 1) {

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
                            for (i = 0; i < _this.dataLength; i += 1) {
                                t1 = 0;
                                for (j = 0; j < 12; j += 1) {

                                    t1 += (t2 * Math.random());
                                }
                                _this.output[i] = _this.amp * (t1 - 6 * t2) / (3 * t2);
                            }
                            _this.singleOutput = _this.output[_this.dataLength - 1];
                            break;

                        default://正弦波
                            for (i = 0; i < _this.dataLength; i += 1) {

                                _this.output[i] = _this.amp * Math.sin(2 * Math.PI * _this.frequency * i * dt + (2 * Math.PI * _this.phase) / 360);
                            }
                            _this.singleOutput = _this.output[_this.dataLength - 1];

                    }
                    _this.phase += 10;
                }
            };

            this.setInitialData = function () {

                _this.signalType = Number($('input[name=SignalGeneratorVI-type]:checked').val());

            };

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
        },
        cnName: '信号发生器',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    StepResponseGeneratorVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'StepResponseGeneratorVI';
            this.zoomValue = 1;

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
            this.outputPointCount = -1;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];
            this.target = [];

            this.setData = function (input) {

                _this.input = Array.isArray(input) ? input[input.length - 1] : input;
                if (Number.isNaN(_this.input)) {

                    return false;
                }
                let v, v1, v2, v21, v3, E, a1, b1;

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
                        if (_this.k2 > 1) {
                            _this.k2 = 1;
                        }
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
                else {
                    _this.singleOutput = 0;
                }

                //将输出数保存在数组内
                let i = 0;
                if (_this.index == 0) {
                    for (i = 0; i < _this.dataLength; i += 1) {
                        _this.output[i] = 0;
                    }
                }
                if (_this.index <= (_this.dataLength - 1)) {
                    _this.output[_this.index] = _this.singleOutput;
                    _this.index += 1;
                }
                else {
                    for (i = 0; i < _this.dataLength - 1; i += 1) {
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

            this.getData = function (dataType) {

                if (dataType === 1) {

                    return _this.singleOutput;
                }
                else {

                    return _this.output;
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
                _this.ctx.fillText(VILibrary.VI.StepResponseGeneratorVI.cnName.substring(0, 2), _this.container.width / 2 - 12, _this.container.height / 4 + 6);
                _this.ctx.fillText(VILibrary.VI.StepResponseGeneratorVI.cnName.substring(2), _this.container.width / 2 - 12, _this.container.height * 3 / 4);
            };

            this.draw();
        },
        cnName: '阶跃响应',
        defaultWidth: '50px',
        defaultHeight: '50px'
    },

    TextVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = domElement.getContext('2d');
            this.name = 'TextVI';
            this.zoomValue = 1;

            this.latestInput = 0;
            this.decimalPlace = 1;
            this.outputPointCount = 0;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];

            //VI双击弹出框
            this.boxTitle = '请输入保留小数位数';
            this.boxContent = '<div class="input-div">' +
                '<input type="number" id="TextVI-input" value="' + this.decimalPlace + '" class="normal-input">' +
                '<button id="startBtn" class="normal-btn" onclick="B.close()">确定</button></div>';

            this.setData = function (latestInput) {

                _this.latestInput = Array.isArray(latestInput) ? latestInput[latestInput.length - 1] : latestInput;
                if (Number.isNaN(_this.latestInput)) {

                    return false;
                }

                let str = parseFloat(_this.latestInput).toFixed(_this.decimalPlace);
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

            this.setInitialData = function () {

                _this.setDecimalPlace($('#TextVI-input').val());
            };

            this.reset = function () {

                _this.originalInput = 0;
                _this.latestInput = 0;
                _this.singleOutput = 0;
                _this.index = 0;
            };

            this.draw = function () {

                _this.ctx.font = "normal 12px Microsoft YaHei";
                _this.ctx.fillStyle = 'orange';
                _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
                _this.ctx.fillStyle = 'black';
                _this.ctx.fillText('文本显示', _this.container.width / 2 - 18, _this.container.height / 2 + 6);
            };

            this.draw();
        },
        cnName: '文本显示',
        defaultWidth: '150px',
        defaultHeight: '50px'
    },

    WaveVI: {

        createVI: function (VICanvas) {

            let domElement = VILibrary.InternalFunction.getDomObject(VICanvas);
            const _this = this;
            this.container = domElement;
            this.ctx = this.container.getContext("2d");
            this.name = 'WaveVI';
            this.zoomValue = 1;

            // console.log(domElement.width+':'+domElement.height);
            //坐标单位//
            this.strLabelX = 'X';
            this.strLabelY = 'Y';

            //坐标数值//
            this.maxValX = 1023;
            this.minValX = 0;
            this.maxValY = 10;
            this.minValY = -10;
            this.autoZoom = true;
            this.outputPointCount = 0;
            this.inputPointCount = 1;
            this.endpoints = {};

            //虚拟仪器中相连接的控件VI
            this.source = [];

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
            if ((_this.container.height >= 200) && (_this.container.width >= 200)) {

                _this.offsetB = 30;
                _this.offsetL = 35;
            }
            this.waveWidth = this.container.width - this.offsetL - this.offsetR;
            this.waveHeight = this.container.height - this.offsetT - this.offsetB;

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

            this.draw = function () {

                _this.drawBackground();
                _this.drawWave();
                if (_this.drawRulerFlag) {

                    _this.drawRuler();
                }
            };

            this.drawWave = function () {

                let ratioX = _this.waveWidth / (_this.pointNum - 1);
                let ratioY = _this.waveHeight / (_this.maxValY - _this.minValY);
                let pointX = [];
                let pointY = [];

                let i;
                for (i = 0; i < _this.pointNum; i += 1) {

                    pointX[i] = _this.offsetL + i * ratioX;
                    pointY[i] = _this.offsetT + (_this.maxValY - _this.bufferVal[i]) * ratioY;
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
                for (i = 1; i < _this.pointNum; i += 1) {

                    _this.ctx.lineTo(pointX[i], pointY[i]);
                }
                _this.ctx.stroke();
                _this.ctx.closePath();
                _this.ctx.save();
            };

            this.drawBackground = function () {

                let ctx = _this.ctx;
                //刷背景//
                ctx.beginPath();
                /* 将这个渐变设置为fillStyle */
                // ctx.fillStyle = grad;
                ctx.fillStyle = _this.bgColor;
                ctx.lineWidth = 3;
                ctx.strokeStyle = "RGB(25, 25, 25)";
                ctx.fillRect(0, 0, _this.container.width, _this.container.height);
                ctx.strokeRect(3, 3, _this.container.width - 6, _this.container.height - 6);
                ctx.closePath();

                //画网格矩形边框和填充
                ctx.beginPath();
                ctx.fillStyle = _this.screenColor;
                ctx.lineWidth = 1;
                ctx.strokeStyle = _this.gridColor;
                ctx.fillRect(_this.offsetL, _this.offsetT, _this.waveWidth, _this.waveHeight);
                ctx.strokeRect(_this.offsetL + 0.5, _this.offsetT + 0.5, _this.waveWidth, _this.waveHeight);
                ctx.closePath();

                let nRow = _this.nRow;
                let nCol = _this.nCol;
                let divX = _this.waveWidth / nCol;
                let divY = _this.waveHeight / nRow;

                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.lineCap = "round";
                ctx.strokeStyle = _this.gridColor;

                let i, j;
                //绘制横向网格线
                for (i = 1; i < nRow; i += 1) {

                    ctx.moveTo(_this.offsetL, divY * i + _this.offsetT);
                    ctx.lineTo(_this.container.width - _this.offsetR, divY * i + _this.offsetT);
                }
                //绘制纵向网格线
                for (j = 1; j < nCol; j += 1) {

                    ctx.moveTo(divX * j + _this.offsetL, _this.offsetT);
                    ctx.lineTo(divX * j + _this.offsetL, _this.container.height - _this.offsetB);
                }
                ctx.stroke();
                ctx.closePath();

                if ((_this.container.height >= 200) && (_this.container.width >= 200)) {

                    let scaleYNum = 8;
                    let scaleXNum = 16;
                    let scaleYStep = _this.waveHeight / scaleYNum;
                    let scaleXStep = _this.waveWidth / scaleXNum;

                    ////////////////画数字字体////////////////
                    ctx.font = "normal 12px Calibri";

                    let strLab;
                    //横标签//
                    strLab = _this.strLabelX;
                    ctx.fillText(strLab, _this.container.width - _this.offsetR - strLab.length * 6 - 10, _this.container.height - _this.offsetB + 20);

                    //纵标签//
                    strLab = _this.strLabelY;
                    ctx.fillText(strLab, strLab.length * 6, _this.offsetT + 12);

                    let valStepX = (_this.maxValX - _this.minValX) / scaleXNum;
                    let valStepY = (_this.maxValY - _this.minValY) / scaleYNum;

                    ctx.fillStyle = _this.fontColor;
                    let temp = 0;
                    //横坐标刻度//
                    for (i = 2; i < scaleXNum; i += 2) {

                        temp = _this.minValX + valStepX * i;
                        ctx.fillText(VILibrary.InternalFunction.fixNumber(temp), _this.offsetL + scaleXStep * i - 9, _this.container.height - 12);
                    }
                    //纵坐标刻度//
                    for (i = 2; i < scaleYNum; i += 2) {

                        temp = _this.maxValY - valStepY * i;
                        ctx.fillText(VILibrary.InternalFunction.fixNumber(temp), _this.offsetL - 28, _this.offsetT + scaleYStep * i + 5);
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
                _this.ctx.lineTo(_this.curPointX + 0.5, _this.container.height - _this.offsetB);
                _this.ctx.stroke();
                let curPointX = parseFloat((_this.curPointX - _this.offsetL) * (_this.maxValX - _this.minValX) / _this.waveWidth)
                .toFixed(2);
                let curPointY = parseFloat(_this.bufferVal[parseInt((_this.curPointX - _this.offsetL) * _this.pointNum / _this.waveWidth)])
                .toFixed(2);
                _this.ctx.fillText('(' + curPointX + ',' + curPointY + ')',
                    _this.container.width - _this.curPointX < 80 ? _this.curPointX - 80 : _this.curPointX + 4, _this.offsetT + 15);
                _this.ctx.closePath();
            };

            this.reset = function () {

                _this.bufferVal = [];
                _this.drawBackground();
            };

            this.setData = function (data) {

                if (!Array.isArray(data)) {

                    console.log('WaveVI: input type error');
                    return false;
                }
                _this.pointNum = data.length > _this.pointNum ? data.length : _this.pointNum;
                let YMax = 0, YMin = 0, i;
                for (i = 0; i < _this.pointNum; i += 1) {

                    _this.bufferVal[i] = data[i] == undefined ? 0 : data[i];
                    YMax = YMax < _this.bufferVal[i] ? _this.bufferVal[i] : YMax;
                    YMin = YMin > _this.bufferVal[i] ? _this.bufferVal[i] : YMin;
                }
                if (_this.autoZoom) {

                    if ((_this.maxValY <= YMax) || (_this.maxValY - YMax > 5 * (YMax - YMin))) {

                        _this.maxValY = 2 * YMax - YMin;
                        _this.minValY = 2 * YMin - YMax;
                    }
                    if ((_this.minValY >= YMin) || (YMin - _this.maxValY > 5 * (YMax - YMin))) {

                        _this.maxValY = 2 * YMax - YMin;
                        _this.minValY = 2 * YMin - YMax;
                    }
                    if (YMax < 0.01 && YMin > -0.01) {

                        _this.maxValY = 1;
                        _this.minValY = -1;
                    }
                }
                _this.draw();
            };

            this.setAxisRangX = function (xMin, xNax) {

                _this.minValX = xMin;
                _this.maxValX = xNax;
                _this.drawBackground();
            };

            this.setAxisRangY = function (yMin, yMax) {

                _this.minValY = yMin;
                _this.maxValY = yMax;
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

            let _mouseOverFlag = false;
            let _mouseOutFlag = false;
            let _dragAndDropFlag = false;
            let _mouseUpFlag = false;
            let _onclickFlag = false;
            let _mouseMoveFlag = false;

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
                }

            };

            function onMouseMove (event) {

                if (!_this.drawRulerFlag || _this.bufferVal.length == 0) {

                    return;
                }
                _this.curPointX = event.offsetX == undefined ? event.layerX : event.offsetX - 1;
                _this.curPointY = event.offsetY == undefined ? event.layerY : event.offsetY - 1;

                if (_this.curPointX <= _this.offsetL) {
                    _this.curPointX = _this.offsetL;
                }
                if (_this.curPointX >= (_this.container.width - _this.offsetR)) {
                    _this.curPointX = _this.container.width - _this.offsetR;
                }
                _this.draw();
                if (_mouseMoveFlag) {
                    _this.mouseMove();
                }
            }

            this.container.addEventListener('mousemove', onMouseMove, false);   // mouseMoveListener
        },
        cnName: '波形显示',
        defaultWidth: '500px',
        defaultHeight: '300px'
    }
};