/**
 * Created by Fengma on 2016/10/26.
 */

/**
 * 震荡响应
 * @param domElement
 * @constructor
 */
function OscillationResponseVI(domElement) {
    'use strict';
    const _this = this;
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
        _this.ctx.fillText('震荡', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('响应', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();
}