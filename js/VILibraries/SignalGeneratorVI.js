/**
 * Created by Fengma on 2016/10/25.
 */

function SignalGeneratorVI(domElement) {
    'use strict';
    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'SignalGeneratorVI';

    this.dataLength = 1024;
    this.phase = 0;
    this.amp = 1;
    this.frequency = 256;
    this.signalType = 1;
    this.output = [];

    //虚拟仪器中相连接的控件VI
    this.target = [];

    /**
     * 信号产生函数
     * @param amp 信号幅值
     * @param f 信号频率
     * @param phase 信号相位
     */
    this.setData = function (amp, f, phase) {

        _this.amp = amp;
        _this.frequency = f;
        _this.phase = phase;
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

                    _this.output[i] = _this.amp * Math.sin(2 * Math.PI * _this.frequency * i / FS + (2 * Math.PI * _this.phase) / 360);
                }
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
                break;
        }
    };

    this.reset = function () {
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

}