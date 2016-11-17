/**
 * Created by Fengma on 2016/11/9.
 */

/**
 * 直流输出
 * @param domElement
 * @constructor
 */
function ButtonVI(domElement) {
    'use strict';
    const _this = this;
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

}