/**
 * Created by Fengma on 2016/11/2.
 */

/**
 * 中继器
 * 无特殊用途，只用来传递数据，输入什么就输出什么
 * @param domElement
 * @constructor
 */
function RelayVI(domElement) {

    'use strict';
    const _this = this;
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

        if (Array.isArray(input)) {

            _this.singleOutput = input[input.length - 1];
            this.output = input;
        }
        else {

            _this.input = input;
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

}