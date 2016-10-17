/**
 * Created by Fengma on 2016/9/8.
 */

// intersects = raycaster.intersectObjects( objects );
// =>
// intersects[0].object = this.focused
//     OR
// intersects[0].object = this.mouseOvered
// this.event = intersects[0];
// this.event.item - number of the selected object

THREE.Object3D.userDataParent = null;
THREE.Mesh.userDataParent = null;

ObjectControls = function (camera, domElement) {

    var _this = this;

    this.camera = camera;
    this.container = ( domElement !== undefined ) ? domElement : document;

    this.focused = null; // focused object
    this.previous = new THREE.Vector3(); // store the previous position of focused object
    var _DisplaceMouseOvered = null; //  object
    this.mouseOvered = null; // mouseOver Object

    this.raycaster = new THREE.Raycaster();

    this.map = null;
    this.event = null;
    this.offset = new THREE.Vector3();
    this.offsetUse = false;
    this.scale = new THREE.Vector3(1, 1, 1);

    this._mouse = new THREE.Vector2();
    this._vector = new THREE.Vector3();
    this._direction = new THREE.Vector3();

    this.collidable = false;
    this.collidableEntities = [];
    this.collision = function () {
        console.log('collision!');
    };

    // API

    this.enabled = true;

    this.objects = [];
    var _DisplaceIntersects = [];
    var _DisplaceIntersectsMap = [];
    this.intersects = [];
    this.intersectsMap = [];

    this.update = function () {
        if (_this.enabled) {
            onContainerMouseMove();
            if (_mouseMoveFlag) _this.mouseMove();
        }
    };

    this.dragAndDrop = function () {};// this.container.style.cursor = 'move';
    this.mouseOver = function () {}; // this.container.style.cursor = 'pointer';
    this.mouseOut = function () {}; // this.container.style.cursor = 'auto';
    this.mouseUp = function () {}; // this.container.style.cursor = 'auto';
    this.mouseMove = function () {};
    this.onclick = function () {};

    this.attach = function (object) {

        if (object instanceof THREE.Mesh) {
            this.objects.push(object);
        }
        else {

            this.objects.push(object);

            for (var i = 0; i < object.children.length; i++) {
                object.children[i].userDataParent = object;
            }
        }

    };

    this.detach = function (object) {

        var item = _this.objects.indexOf(object);
        this.objects.splice(item, 1);

    };

    var _mouseOverFlag = false;
    var _mouseOutFlag = false;
    var _dragAndDropFlag = false;
    var _mouseUpFlag = false;
    var _onclickFlag = false;
    var _mouseMoveFlag = false;

    this.attachEvent = function (event, handler) {

        switch (event) {
            case 'mouseOver':   this.mouseOver = handler;   _mouseOverFlag = true;  break;
            case 'mouseOut':    this.mouseOut = handler;    _mouseOutFlag = true;   break;
            case 'dragAndDrop': this.dragAndDrop = handler; _dragAndDropFlag = true;    break;
            case 'mouseUp': this.mouseUp = handler; _mouseUpFlag = true;    break;
            case 'onclick': this.onclick = handler; _onclickFlag = true;    break;
            case 'mouseMove':   this.mouseMove = handler;   _mouseMoveFlag = true;  break;
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

    this.setFocus = function (object) {

        _this.event.item = _this.objects.indexOf(object);

        if (object.userDataParent) {
            this.focused = object.userDataParent;
            this.previous.copy(this.focused.position);
        }
        else {
            this.focused = object;
            this.previous.copy(this.focused.position);
        }

    };

    this.removeFocus = function () {

        this.focused = null;
        this.event = null;

    };

    this.select = function (object) {

        _DisplaceMouseOvered = object;
        _this.event.item = _this.objects.indexOf(object);
        if (object.userDataParent) {
            this.mouseOvered = object.userDataParent;
        }
        else {
            this.mouseOvered = object;
        }

    };

    this.deselect = function () {

        _DisplaceMouseOvered = null;
        this.mouseOvered = null;
        this.event = null;

    };

    this.returnPrevious = function () {

        _this.focused.position.copy(this.previous);

    };


    this._setMap = function () {

        _this.intersectsMap = _DisplaceIntersectsMap;

    };

    function getMousePos(event) {
        if (_this.enabled) {
            var x = event.offsetX == undefined ? event.layerX : event.offsetX;
            var y = event.offsetY == undefined ? event.layerY : event.offsetY;

            //change the zero point form top-left corner to center of the container and normalize the coordinate
            _this._mouse.x = ( ( x ) / _this.container.width ) * 2 - 1;
            _this._mouse.y = -( ( y ) / _this.container.height ) * 2 + 1;

            onContainerMouseMove();
            if (_mouseMoveFlag) _this.mouseMove();
        }
    }

    function onContainerMouseDown(event) {

        if (_this.enabled && ( _onclickFlag || _dragAndDropFlag )) {
            if (_this.focused) {
                return;
            }
            _this.raycaster.setFromCamera(_this._mouse, camera);
            _this.intersects = _this.raycaster.intersectObjects(_this.objects, true);

            if (_this.intersects.length > 0) {

                _this.event = _this.intersects[0];
                _this.setFocus(_this.intersects[0].object);

                if (_dragAndDropFlag) {
                    _this.intersects = _this.raycaster.intersectObject(_this.map);

                    try {
                        if (_this.offsetUse) {
                            var pos = new THREE.Vector3().copy(_this.focused.position);
                            pos.x = pos.x / _this.scale.x;
                            pos.y = pos.y / _this.scale.y;
                            pos.z = pos.z / _this.scale.z;
                            _this.offset.subVectors(_this.intersects[0].point, pos);
                            // console.log(_this.offset);
                        }
                        //_this.offset.copy( _this.intersects[ 0 ].point ).sub( _this.map.position );
                    }
                    catch (e) {
                    }

                }

                _this.onclick();

            }
            else {
                _this.removeFocus();
                _this.event = null;
            }
        }
    }

    function onContainerMouseMove() {

        _this.raycaster.setFromCamera(_this._mouse, camera);

        if (_this.focused) {

            if (_dragAndDropFlag) {
                _DisplaceIntersectsMap = _this.raycaster.intersectObject(_this.map);
                //_this._setMap();
                try {
                    var pos = new THREE.Vector3().copy(_DisplaceIntersectsMap[0].point.sub(_this.offset));
                    pos.x *= _this.scale.x;
                    pos.y *= _this.scale.y;
                    pos.z *= _this.scale.z;
                    _this.focused.position.copy(pos);
                }
                catch (err) {
                }

                _this.dragAndDrop();
            }
        }
        else {

            if (_mouseOverFlag) {

                _DisplaceIntersects = _this.raycaster.intersectObjects(_this.objects, true);
                _this.intersects = _DisplaceIntersects;
                if (_this.intersects.length > 0) {
                    _this.event = _this.intersects[0];
                    if (_this.mouseOvered) {
                        if (_DisplaceMouseOvered != _this.intersects[0].object) {
                            _this.mouseOut();
                            _this.select(_this.intersects[0].object);
                            _this.mouseOver();
                        }
                    }
                    else {
                        _this.select(_this.intersects[0].object);
                        _this.mouseOver();
                    }
                }
                else {
                    if (_DisplaceMouseOvered) {
                        _this.mouseOut();
                        _this.deselect();
                    }
                }
            }
        }

        if (_this.focused) {
            if (_this.collidable) {
                var originPoint = _this.focused.position.clone();
                for (var vertexIndex = 0; vertexIndex < _this.focused.geometry.vertices.length; vertexIndex++) {

                    var localVertex = _this.focused.geometry.vertices[vertexIndex].clone();
                    var globalVertex = _this.focused.localToWorld(localVertex);
                    var directionVector = new THREE.Vector3().copy(globalVertex);
                    directionVector.sub(_this.focused.position);

                    _this.raycaster.set(originPoint, directionVector.clone().normalize());
                    var collisionResults = _this.raycaster.intersectObjects(_this.collidableEntities);

                    if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
                        _this.collision();
                        break;
                    }

                }
            }

        }

    }

    function onContainerMouseUp(event) {

        if (_this.enabled) {
            if (_this.focused) {

                _this.mouseUp();
                _this.focused = null;

            }
        }

    }

    this.container.addEventListener('mousedown', onContainerMouseDown, false);  // mouseDownListener
    this.container.addEventListener('mousemove', getMousePos, false);   // mouseMoveListener
    this.container.addEventListener('mouseup', onContainerMouseUp, false);  // mouseUpListener

};