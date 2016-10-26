/**
 * Created by Fengma on 2016/10/25.
 */

function InputVI(domElement) {
    'use strict';
    var _this = this;
    this.container = domElement;
    this.ctx = domElement.getContext('2d');
    this.name = 'InputVI';

    this.dataLength = 1024;
    this.index = 0;
    this.lastOutput = 100;//输出初值
    this.output = [];

    //虚拟仪器中相连接的控件VI
    this.target = [];

    /**
     * 将输出数保存在数组内
     * @param data singleOutput
     */
    this.setData = function (data) {

        if (isNaN(data)) {

            return;
        }
        _this.lastOutput = data;
        var i = 0;
        if (_this.index == 0) {
            for (i = 0; i < _this.dataLength; i++) {
                _this.output[i] = 0;
            }
        }
        if (_this.index <= (_this.dataLength - 1)) {
            _this.output[_this.index] = _this.lastOutput;
            _this.index++;
        } else {
            for (i = 0; i < _this.dataLength - 1; i++) {
                _this.output[i] = _this.output[i + 1];
            }
            _this.output[_this.dataLength - 1] = _this.lastOutput;
        }
    };

    this.reset = function () {

        _this.index = 0;
    };

    this.draw = function () {
        _this.ctx.font = "normal 12px Microsoft YaHei";
        _this.ctx.fillStyle = 'orange';
        _this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
        _this.ctx.fillStyle = 'black';
        _this.ctx.fillText('直流', _this.container.width / 2 - 12, _this.container.height / 4 + 6);
        _this.ctx.fillText('输入', _this.container.width / 2 - 12, _this.container.height * 3 / 4);
    };

    this.draw();

}