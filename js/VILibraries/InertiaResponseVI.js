/**
 * Created by Fengma on 2016/10/26.
 */

/**
 * 惯性响应
 * @param domElement
 * @constructor
 */
function InertiaResponseVI(domElement) {
    'use strict';
    const _this = this;
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


}