/**
 * Created by Fengma on 2016/11/10.
 */

'use strict';

let VILibrary = {REVISION: '1.0'};

VILibrary.InnerObjects = {
	
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
	
	getVIById: function (id) {
		
		for (let VI of this.existingVIArray) {
			
			if (VI.id === id) {
				return VI
			}
		}
		return false;
	},
	
	getVIcnName: function (VIName) {
		
		if (VILibrary.VI.hasOwnProperty(VIName)) {
			
			return VILibrary.VI[VIName].cnName;
		}
		return false;
	},
	
	/**
	 * 查询某个VI已绑定的其他VI(默认包含自己)，调用后查询结果会存在boundVIArray中，
	 * @param VI 需查询的VI
	 */
	findBoundVI: function (VI) {
		
		let boundVIArray = [];
		boundVIArray.push(VI);
		if (VI.sourceInfoArray) {
			
			if (VI.sourceInfoArray.length > 0) {
				
				for (let sourceInfo of VI.sourceInfoArray) {
					
					let tempSourceVI = this.getVIById(sourceInfo[0]);
					if (boundVIArray.indexOf(tempSourceVI) === -1) {
						
						this.findBoundVI(tempSourceVI, boundVIArray);
					}
				}
			}
		}
		if (VI.targetInfoArray) {
			
			if (VI.targetInfoArray.length > 0) {
				
				for (let targetInfo of VI.targetInfoArray) {
					
					let tempTargetVI = this.getVIById(targetInfo[0]);
					
					if (boundVIArray.indexOf(tempTargetVI) === -1) {
						
						this.findBoundVI(tempTargetVI, boundVIArray);
					}
				}
			}
		}
		return boundVIArray;
	},
	
	bindDataLine: function (sourceId, targetId, sourceOutputType, targetInputType) {
		
		let sourceVI = this.getVIById(sourceId);
		let targetVI = this.getVIById(targetId);
		let sourceInfo = [sourceId, sourceOutputType, targetInputType];
		let targetInfo = [targetId, sourceOutputType, targetInputType];
		if (sourceVI.targetInfoArray.indexOf(targetInfo) !== -1 || targetVI.sourceInfoArray.indexOf(sourceInfo) !== -1) {
			
			console.log('Already bound!');
			return
		}
		sourceVI.targetInfoArray.push(targetInfo);
		targetVI.sourceInfoArray.push(sourceInfo);
		
		//******************************分配dataLine*******************************************//
		if (!sourceVI.dataLine && !targetVI.dataLine) {//均未赋过值说明未与其他VI连接，赋一个未被占用的dataLine
			
			let newDataLine = this.dataLineArray.length > 0 ?
				(Math.max.apply(null, this.dataLineArray) + 1 ) : 1;
			this.dataLineArray.push(newDataLine);
			sourceVI.dataLine = newDataLine;
			targetVI.dataLine = newDataLine;
		}
		else if (!sourceVI.dataLine && targetVI.dataLine) {//将已有dataLine赋给无dataLine的
			
			sourceVI.dataLine = targetVI.dataLine;
		}
		else if (sourceVI.dataLine && !targetVI.dataLine) {
			
			targetVI.dataLine = sourceVI.dataLine;
		}
		else if (sourceVI.dataLine > targetVI.dataLine) {//均有dataLine，合并较大的那个到较小的
			
			for (let VI of this.existingVIArray) {
				
				VI.dataLine = VI.dataLine === sourceVI.dataLine ? targetVI.dataLine : VI.dataLine;
			}
		}
		else if (sourceVI.dataLine < targetVI.dataLine) {
			
			for (let VI of this.existingVIArray) {
				
				VI.dataLine = VI.dataLine === targetVI.dataLine ? sourceVI.dataLine : VI.dataLine;
			}
		}
	},
	
	//解绑默认将与targetVI相关的VI赋新dataLine值
	unbindDataLine: function (sourceId, targetId) {
		
		let sourceVI = this.getVIById(sourceId);
		let targetVI = this.getVIById(targetId);
		
		//**********************************删除绑定信息**************************************//
		for (let targetInfo of sourceVI.targetInfoArray) {
			
			if (targetInfo[0] === targetId) {
				
				sourceVI.targetInfoArray.splice(sourceVI.targetInfoArray.indexOf(targetInfo), 1);
				break;
			}
		}
		for (let sourceInfo of targetVI.sourceInfoArray) {
			
			if (sourceInfo[0] === sourceId) {
				
				targetVI.sourceInfoArray.splice(targetVI.sourceInfoArray.indexOf(sourceInfo), 1);
				break;
			}
		}
		
		//*****************************重分配dataLine*************************************//
		let sourceVIBoundVIArray, targetVIBoundVIArray;
		
		sourceVIBoundVIArray = this.findBoundVI(sourceVI);
		targetVIBoundVIArray = this.findBoundVI(targetVI);
		
		if (sourceVIBoundVIArray.length === 1) {//无其他VI相连
			
			sourceVI.dataLine = 0;
		}
		//检测sourceVI与targetVI断开后有没有间接与targetVI相连，仍然相连则无需赋新dataLine值
		if (targetVIBoundVIArray.indexOf(sourceVI) === -1) {
			
			if (targetVIBoundVIArray.length === 1) {//无其他VI相连
				
				targetVI.dataLine = 0;
			}
			else {
				
				let newDataLine = Math.max.apply(null, this.dataLineArray) + 1;
				for (let VI of targetVIBoundVIArray) {
					
					VI.dataLine = newDataLine;
				}
			}
		}
	},
	
	dataUpdater: function (dataLine) {
		
		if (!dataLine) {
			
			return;
		}
		for (let VI of this.existingVIArray) {
			
			if (VI.dataLine === dataLine && VI.hasOwnProperty('updater')) {
				
				VI.updater();
			}
		}
	},
	
	//双击VI弹出框
	showBox: function (VI) {
		
		if (VI.boxTitle) {
			
			layer.open({
				type: 1,
				title: VI.boxTitle,
				area: ['auto', 'auto'],
				shade: 0.3,
				shadeClose: true,
				closeBtn: false,
				zIndex: layer.zIndex,
				content: VI.boxContent,
				btnAlign: 'c',
				btn: ['确定', '取消'],
				yes: function (index) {
					VI.setInitialData();
					layer.close(index);
				},
				btn2: function (index) {
					layer.close(index);
				},
				success: function (layero) {
					layer.setTop(layero);
				}
			});
		}
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
	},
	
	loadModule: function (MTLUrl, OBJUrl) {
		
		let objLoader = new THREE.OBJLoader();
		let mtlLoader = new THREE.MTLLoader();
		return new Promise(function (resolve, reject) {
			mtlLoader.load(MTLUrl, function (material) {
				objLoader.setMaterials(material);
				objLoader.load(OBJUrl, function (a) {
					
					a.traverse(function (child) {
						if (child instanceof THREE.Mesh) {
							
							child.material.side = THREE.DoubleSide;
						}
					});
					resolve(a);
				});
			})
		})
	},
	existingVIArray: [],
	dataLineArray: []
};

class TemplateVI {
	
	constructor(VICanvas) {
		
		if (new.target === TemplateVI) {
			
			throw new Error('本VI为模版，不能实例化');
		}
		let domElement = VILibrary.InnerObjects.getDomObject(VICanvas);
		const _this = this;
		this.container = domElement;
		this.id = domElement.id;
		this.fillStyle = 'orange';
		this.timer = 0;
		this.index = 0;
		this.dataLength = 1024;
		this.output = [0];
		this.outputPointCount = -1;//-1为无限制输出
		this.inputPointCount = 1;
		//与其他VI的连接信息
		this.sourceInfoArray = [];//[sourceVIId, sourceOutputType,thisInputType]二维数组，第二维分别存储sourceVI的ID、sourceVI输出类型、自己的输入类型
		this.targetInfoArray = [];//[targetVIId, thisOutputType,targetInputType]二维数组，第二维分别存储targetVI的ID、自己的输出类型、targetVI的输入类型
		this.dataLine = 0;
		
		VILibrary.InnerObjects.existingVIArray.push(this);
		this.constructor.logCount++;
		
		this.toggleObserver = function (flag) {
			
			if (flag) {
				
				if (!this.timer && this.dataLine) {
					
					this.fillStyle = 'red';
					this.draw();
					this.timer = window.setInterval(function () {
						
						VILibrary.InnerObjects.dataUpdater(_this.dataLine);
					}, 50);
				}
			}
			else {
				
				if (this.timer) {
					
					window.clearInterval(this.timer);
					this.timer = 0;
				}
				this.fillStyle = 'orange';
				this.draw();
			}
		};
		
		this.updater = function () {
			
			if (this.sourceInfoArray.length > 0) {
				
				for (let sourceInfo of this.sourceInfoArray) {
					
					let sourceVI = VILibrary.InnerObjects.getVIById(sourceInfo[0]);
					let sourceOutputType = sourceInfo[1];
					let inputType = sourceInfo[2];
					let sourceData = sourceVI.getData(sourceOutputType);
					this.setData(sourceData, inputType);
				}
			}
		};
		
		this.destroy = function () {
			
			let index = VILibrary.InnerObjects.existingVIArray.indexOf(this);
			if (index !== -1) {
				
				VILibrary.InnerObjects.existingVIArray.splice(index, 1);
			}
			if (this.timer) {
				
				window.clearInterval(this.timer);
				this.timer = 0;
			}
			this.dataLine = 0;
		};
		
		this.setData = function () {
		};
		
		this.getData = function () {
			
			return this.output;
		};
		
		this.reset = function () {
			
			this.toggleObserver(false);
			this.index = 0;
			this.output = [0];
		};
		
		this.draw = function () {
			
			this.ctx = this.container.getContext("2d");
			this.ctx.font = 'normal 14px Microsoft YaHei';
			this.ctx.fillStyle = this.fillStyle;
			this.ctx.fillRect(0, 0, this.container.width, this.container.height);
			this.ctx.fillStyle = 'black';
			let length = this.constructor.cnName.length;
			if (length > 4) {
				
				this.ctx.fillText(this.constructor.cnName.substring(0, 4), this.container.width / 2 - 14 * 4 / 2, this.container.height / 4 + 6);
				this.ctx.fillText(this.constructor.cnName.substring(4), this.container.width / 2 - 14 * (length - 4) / 2, this.container.height * 3 / 4);
				
			}
			else {
				
				this.ctx.fillText(this.constructor.cnName, this.container.width / 2 - 14 * length / 2, this.container.height / 2 + 6);
			}
		};
		
		this.handleDblClick = function (e) {
			
			VILibrary.InnerObjects.showBox(_this);
		};
		
		this.container.addEventListener('dblclick', this.handleDblClick, false);
	}
	
	static get cnName() {
		
		return 'VI模版';
	}
	
	static get defaultWidth() {
		
		return '65px';
	}
	
	static get defaultHeight() {
		
		return '50px';
	}
}
//因ES6定义Class内只有静态方法没有静态属性，只能在Class外定义
TemplateVI.logCount = 0;

VILibrary.VI = {
	
	AudioVI: class AudioVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			
			let audioCtx = new (window.AudioContext || webkitAudioContext)(),
				analyser = audioCtx.createAnalyser(), source, timeStamp = 0, point = {};
			
			this.name = 'AudioVI';
			this.ctx = this.container.getContext("2d");
			this.inputPointCount = 0;
			this.fillStyle = 'silver';
			
			this.toggleObserver = function (flag) {
				
				if (flag) {
					
					if (!this.timer) {
						
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
								analyser.fftSize = _this.dataLength * 2;
								source.connect(analyser);
								analyser.connect(audioCtx.destination);
								
								let bufferLength = analyser.frequencyBinCount;
								console.log(bufferLength);
								let dataArray = new Uint8Array(bufferLength);
								
								function getAudioData() {
									
									if (_this.dataLine) {
										
										_this.timer = window.requestAnimationFrame(getAudioData);
										
										analyser.getByteTimeDomainData(dataArray);
										_this.output = Array.from(dataArray);
										
										//定时更新相同数据线VI的数据
										VILibrary.InnerObjects.dataUpdater(_this.dataLine);
									}
									else {
										
										_this.toggleObserver(false);
									}
								}
								
								getAudioData();
								
								_this.fillStyle = 'red';
								_this.draw();
							}
						).catch(function (err) {
							_this.timer = 0;
							console.log('AudioVI: ' + err.name + ": " + err.message);
						});
					}
				}
				else {
					if (this.timer) {
						
						//切断音频输出
						analyser.disconnect(audioCtx.destination);
						window.cancelAnimationFrame(_this.timer);
						_this.timer = 0;
					}
					_this.fillStyle = 'silver';
					_this.draw();
				}
			};
			
			this.draw = function () {
				
				let img = new Image();
				new Promise(function (resolve, reject) {
					
					img.src = 'img/mic.png';
					img.onload = resolve;
					img.onerror = reject;
				}).then(function () {
					
					_this.ctx.fillStyle = _this.fillStyle;
					_this.ctx.fillRect(0, 0, _this.container.width, _this.container.height);
					_this.ctx.drawImage(img, 0, 0, _this.container.width, _this.container.height);
				}).catch(function (e) {
					console.log('AudioVI:' + e);
				});
			};
			
			this.draw();
			
			this.container.addEventListener('mousedown', function (e) {
				
				timeStamp = e.timeStamp;
				point.x = e.clientX;
				point.y = e.clientY;
			}, false);
			
			this.container.addEventListener('mouseup', function (e) {
				
				//X、Y移动距离小于5，点击间隔小于200，默认点击事件
				if ((e.timeStamp - timeStamp) < 200 && (point.x - e.clientX) < 5 && (point.y - e.clientY) < 5) {
					
					if (_this.dataLine) {
						
						_this.toggleObserver(!_this.timer);
					}
				}
			}, false);
		}
		
		static get cnName() {
			
			return '麦克风';
		}
		
		static get defaultWidth() {
			
			return '80px';
		}
		
		static get defaultHeight() {
			
			return '80px';
		}
	},
	
	KnobVI: class KnobVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			
			let spinnerFlag = false, startX, startY, stopX, stopY, roundCount = 0;
			let knob_Base = new Image(), knob_Spinner = new Image();
			let _mouseOverFlag = false, _mouseOutFlag = false, _dragAndDropFlag = false,
				_mouseUpFlag = false, _onclickFlag = false, _mouseMoveFlag = false;
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
			let dataTip = $('');
			
			this.name = 'KnobVI';
			this.ctx = this.container.getContext("2d");
			this.inputPointCount = 0;
			this.output = [100];
			this.minValue = 0;
			this.maxValue = 100;
			this.defaultValue = 100;
			this.ratio = (this.maxValue - this.minValue) / (Math.PI * 1.5);
			this.radian = (this.defaultValue - this.minValue) / this.ratio;
			//VI双击弹出框
			this.boxTitle = '请输入初始值';
			this.boxContent = '<div class="input-div">' +
				'<span class="normal-span">最小值:</span><input type="number" id="KnobVI-input-1" value="' + this.minValue + '" class="normal-input">' +
				'<span class="normal-span">最大值:</span><input type="number" id="KnobVI-input-2" value="' + this.maxValue + '" class="normal-input">' +
				'<span class="normal-span">初值:</span><input type="number" id="KnobVI-input-3" value="' + this.defaultValue + '" class="normal-input"></div>';
			
			//设置旋钮初始参数
			this.setDataRange = function (minValue, maxValue, startValue) {
				
				let minVal = Number.isNaN(minValue) ? 0 : minValue;
				let maxVal = Number.isNaN(maxValue) ? 1 : maxValue;
				let startVal = Number.isNaN(startValue) ? 0 : startValue;
				if (minVal >= maxVal || startVal < minVal || startVal > maxVal) {
					
					console.log('KnobVI: DataRange set error!');
					return false;
				}
				
				this.minValue = minVal;
				this.maxValue = maxVal;
				this.defaultValue = startVal;
				
				this.ratio = (this.maxValue - this.minValue) / (Math.PI * 1.5);
				this.setData(this.defaultValue);
				this.radian = (this.defaultValue - this.minValue) / this.ratio;
				
				this.draw();
				
				this.boxContent = '<div class="input-div">' +
					'<span class="normal-span">最小值:</span><input type="number" id="KnobVI-input-1" value="' + this.minValue + '" class="normal-input">' +
					'<span class="normal-span">最大值:</span><input type="number" id="KnobVI-input-2" value="' + this.maxValue + '" class="normal-input">' +
					'<span class="normal-span">初值:</span><input type="number" id="KnobVI-input-3" value="' + this.defaultValue + '" class="normal-input"></div>';
			};
			
			this.setData = function (data) {
				
				if (Number.isNaN(data)) {
					
					console.log('KnobVI: Not a number!');
					return false;
				}
				if (data < this.minValue || data > this.maxValue) {
					
					console.log('KnobVI: Out of range!');
					return false;
				}
				
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = data;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = data;
				}
			};
			
			this.setInitialData = function () {
				
				let minValue = Number($('#KnobVI-input-1').val());
				let maxValue = Number($('#KnobVI-input-2').val());
				let defaultValue = Number($('#KnobVI-input-3').val());
				this.setDataRange(minValue, maxValue, defaultValue);
			};
			
			this.reset = function () {
				
				this.index = 0;
				this.output = [100];
				this.minValue = 0;
				this.maxValue = 100;
				this.defaultValue = 100;
			};
			
			this.draw = function () {
				
				let xPos = this.container.width / 2;
				let yPos = this.container.height / 2;
				this.ctx.clearRect(0, 0, this.container.width, this.container.height);
				this.ctx.drawImage(knob_Base, 0, 0, this.container.width, this.container.height);
				this.ctx.save();   //保存之前位置
				this.ctx.translate(xPos, yPos);
				this.ctx.rotate(this.radian - 135 / 180 * Math.PI);  //旋转, 初始位置为左下角
				this.ctx.translate(-xPos, -yPos);
				this.ctx.drawImage(knob_Spinner, 0, 0, this.container.width, this.container.height);
				this.ctx.restore();  //恢复之前位置
				this.ctx.beginPath();
				this.ctx.font = "normal 14px Calibri";
				this.ctx.fillText(this.minValue.toString(), 0, this.container.height);
				this.ctx.fillText(this.maxValue.toString(), this.container.width - 7 * this.maxValue.toString().length, this.container.height); //字体大小为14
				this.ctx.closePath();
			};
			
			Promise.all([p1, p2]).then(function () {
				_this.draw();
			})
				.catch(function (e) {
					console.log('KnobVI:' + e);
				});
			
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
			
			function onMouseDown(e) {
				
				let tempData = rotateAxis(e.offsetX - _this.container.width / 2, -(e.offsetY - _this.container.height / 2), 135);
				startX = tempData[0];
				startY = tempData[1];
				if ((startX * startX + startY * startY) <= _this.container.width / 2 * _this.container.width / 2 * 0.5) {
					
					spinnerFlag = true;
				}
			}
			
			function onMouseMove(e) {
				
				let tempData = rotateAxis(e.offsetX - _this.container.width / 2, -(e.offsetY - _this.container.height / 2), 135);
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
					//旋钮数据更新后全局更新一次
					if (_this.dataLine) {
						
						VILibrary.InnerObjects.dataUpdater(_this.dataLine);
					}
					_this.draw();
					startX = stopX;
					startY = stopY;
					
					if (_mouseMoveFlag) {
						
						_this.mouseMove();
					}
				}
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">输出值:' + _this.output[_this.output.length - 1].toFixed(2) + '</span></div>');
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}
			
			function onMouseUp() {
				
				spinnerFlag = false;
				roundCount = 0;
				
				if (_mouseUpFlag) {
					
					_this.mouseUp();
				}
			}
			
			function onMouseOut() {
				
				dataTip.remove();
			}
			
			function calculateRadian(x1, y1, x2, y2) {
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
			function rotateAxis(x, y, angle) {
				let radian = angle / 180 * Math.PI;
				return [Math.sin(radian) * y + Math.cos(radian) * x, Math.cos(radian) * y - Math.sin(radian) * x];
			}
			
			this.container.addEventListener('mousemove', onMouseMove, false);
			this.container.addEventListener('mousedown', onMouseDown, false);
			this.container.addEventListener('mouseup', onMouseUp, false);
			this.container.addEventListener('mouseout', onMouseOut, false);
		}
		
		static get cnName() {
			
			return '旋钮';
		}
		
		static get defaultWidth() {
			
			return '150px';
		}
		
		static get defaultHeight() {
			
			return '150px';
		}
	},
	
	DCOutputVI: class DCOutputVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let timeStamp = 0, point = {}, checkClickTimer = null;
			let dataTip = $('');
			
			this.name = 'DCOutputVI';
			this.inputPointCount = 0;
			
			//VI双击弹出框
			this.boxTitle = '请设置输出值';
			this.boxContent = '<div class="input-div"><span class="normal-span">输出值:</span>' +
				'<input type="number" id="DCOutputVI-input" value="' + this.output[this.output.length - 1] + '" class="normal-input"></div>';
			
			this.updater = function () {
				
				this.setData(this.output);
			};
			
			this.setData = function (input) {
				
				let temp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(temp)) {
					
					return false;
				}
				
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = temp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = temp;
				}
				this.boxContent = '<div class="input-div"><span class="normal-span">输出值:</span>' +
					'<input type="number" id="DCOutputVI-input" value="' + temp + '" class="normal-input"></div>';
			};
			
			this.setInitialData = function () {
				
				this.setData($('#DCOutputVI-input').val());
			};
			
			this.draw();
			
			this.container.addEventListener('mousedown', function (e) {
				
				timeStamp = e.timeStamp;
				point.x = e.clientX;
				point.y = e.clientY;
			}, false);
			this.container.addEventListener('mouseup', function (e) {
				
				//X、Y移动距离小于5，点击间隔小于200，默认点击事件
				if ((e.timeStamp - timeStamp) < 200 && (point.x - e.clientX) < 5 && (point.y - e.clientY) < 5) {
					
					if (_this.dataLine) {
						
						clearTimeout(checkClickTimer);
						checkClickTimer = setTimeout(function () {
							
							_this.toggleObserver(!_this.timer);
						}, 250);
					}
				}
			}, false);
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">输出值:' + _this.output[_this.output.length - 1].toFixed(2) + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
			
			//重写双击事件，先去除模版VI旧的绑定再添加新的
			this.container.removeEventListener('dblclick', this.handleDblClick);
			
			this.handleDblClick = function (e) {
				
				clearTimeout(checkClickTimer);
				VILibrary.InnerObjects.showBox(_this);
			};
			
			this.container.addEventListener('dblclick', this.handleDblClick, false);
		}
		
		static get cnName() {
			
			return '直流输出';
		}
		
	},
	
	AddVI: class AddVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'AddVI';
			this.inputPointCount = 2;
			this.originalInput = 0;
			this.latestInput = 0;
			
			//多输入选择弹出框
			this.inputBoxTitle = '请选择加法器输入参数';
			this.inputBoxContent = '<div class="input-div">' +
				'<div><input type="radio" id="type1" class="radio-input" name="input-type" value="1" alt="初值">' +
				'<label class="input-label" for="type1">初值</label></div>' +
				'<div><input type="radio" id="type2" class="radio-input" name="input-type" value="2" alt="反馈值">' +
				'<label class="input-label" for="type2">反馈值</label></div></div>';
			//VI双击弹出框
			this.boxTitle = '请输入初始值';
			this.boxContent = '<div class="input-div"><span class="normal-span">初值:</span>' +
				'<input type="number" id="AddVI-input" value="' + this.originalInput + '" class="normal-input"></div>';
			
			this.setData = function (input, inputType) {
				
				let inputValue = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputValue)) {
					
					console.log('AddVI: Input value error');
					return false;
				}
				
				if (inputType === 1) {
					
					this.originalInput = inputValue;
					this.boxContent = '<div class="input-div"><span class="normal-span">初值:</span>' +
						'<input type="number" id="AddVI-input" value="' + this.originalInput + '" class="normal-input"></div>';
				}
				else {
					
					this.latestInput = inputValue;
					let temp = parseFloat(this.originalInput - this.latestInput).toFixed(2);
					
					if (this.index <= (this.dataLength - 1)) {
						
						this.output[this.index] = temp;
						this.index += 1;
					}
					else {
						
						let i;
						for (i = 0; i < this.dataLength - 1; i += 1) {
							
							this.output[i] = this.output[i + 1];
						}
						this.output[this.dataLength - 1] = temp;
					}
				}
				
			};
			
			this.setInitialData = function () {
				
				this.setData(Number($('#AddVI-input').val()), 1);
			};
			
			this.reset = function () {
				
				this.originalInput = 0;
				this.latestInput = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">输入值:' + _this.originalInput.toFixed(2) + '</span>' +
					'<span class="normal-span">反馈值:' + _this.latestInput.toFixed(2) + '</span>' +
					'<span class="normal-span">输出值:' + _this.output[_this.output.length - 1].toFixed(2) + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '加法器';
		}
	},
	
	FFTVI: class FFTVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			this.name = 'FFTVI';
			this.setData = function (input) {
				
				if (!Array.isArray(input)) {
					
					return;
				}
				this.output = VILibrary.InnerObjects.fft(1, 10, input);
				return this.output;
				
			};
			
			this.draw = function () {
				
				this.ctx = this.container.getContext("2d");
				this.ctx.font = 'normal 14px Microsoft YaHei';
				this.ctx.fillStyle = 'orange';
				this.ctx.fillRect(0, 0, this.container.width, this.container.height);
				this.ctx.fillStyle = 'black';
				this.ctx.fillText(this.constructor.cnName, this.container.width / 2 - 7 * 3 / 2, this.container.height / 2 + 6);
			};
			
			this.draw();
		}
		
		static get cnName() {
			
			return 'FFT';
		}
	},
	
	PIDVI: class PIDVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'PIDVI';
			this.lastInput = 0;
			this.P = 1;
			this.I = 1;
			this.D = 1;
			this.Fs = 100;
			this.temp1 = 0;
			
			//VI双击弹出框
			this.boxTitle = '请输入PID参数';
			this.boxContent = '<div class="input-div">' +
				'<span class="normal-span">P:</span><input type="number" id="PIDVI-input-1" value="' + this.P + '" class="normal-input">' +
				'<span class="normal-span">I:</span><input type="number" id="PIDVI-input-2" value="' + this.I + '" class="normal-input">' +
				'<span class="normal-span">D:</span><input type="number" id="PIDVI-input-3" value="' + this.D + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let temp1 = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(temp1)) {
					
					console.log('PIDVI: Input value error');
					return false;
				}
				
				let v1, v2, v3, v21;
				
				v1 = this.P * temp1;
				
				v21 = this.temp1 + 0.5 * (Number(temp1) + Number(this.lastInput)) / this.Fs;
				this.temp1 = v21;
				v2 = this.I * v21;
				
				v3 = this.D * (temp1 - this.lastInput) * this.Fs;
				
				this.lastInput = Number(parseFloat(temp1).toFixed(2));
				let temp2 = Number(parseFloat(v1 + v2 + v3).toFixed(2));
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = temp2;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = temp2;
				}
				
			};
			
			this.setPID = function (P, I, D) {
				
				if (isNaN(P) || isNaN(I) || isNaN(D)) {
					
					return
				}
				this.P = P;
				this.I = I;
				this.D = D;
				this.boxContent = '<div class="input-div">' +
					'<span class="normal-span">P:</span><input type="number" id="PIDVI-input-1" value="' + this.P + '" class="normal-input">' +
					'<span class="normal-span">I:</span><input type="number" id="PIDVI-input-2" value="' + this.I + '" class="normal-input">' +
					'<span class="normal-span">D:</span><input type="number" id="PIDVI-input-3" value="' + this.D + '" class="normal-input"></div>';
			};
			
			this.setInitialData = function () {
				
				let P = Number($('#PIDVI-input-1').val());
				let I = Number($('#PIDVI-input-2').val());
				let D = Number($('#PIDVI-input-3').val());
				this.setPID(P, I, D);
			};
			
			this.reset = function () {
				
				this.lastInput = 0;
				this.P = 1;
				this.I = 1;
				this.D = 1;
				this.Fs = 100;
				this.temp1 = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw = function () {
				
				this.ctx = this.container.getContext("2d");
				this.ctx.font = 'normal 14px Microsoft YaHei';
				this.ctx.fillStyle = 'orange';
				this.ctx.fillRect(0, 0, this.container.width, this.container.height);
				this.ctx.fillStyle = 'black';
				this.ctx.fillText(this.constructor.cnName.substring(0, 3), this.container.width / 2 - 7 * 3 / 2, this.container.height / 4 + 6);
				this.ctx.fillText(this.constructor.cnName.substring(3), this.container.width / 2 - 14 * 3 / 2, this.container.height * 3 / 4);
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">P:' + _this.P + '</span>' +
					'<span class="normal-span">I:' + _this.I + '</span>' +
					'<span class="normal-span">D:' + _this.D + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return 'PID控制器';
		}
	},
	
	VibrateSystemVI: class VibrateSystemVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			let Fs = 200, freedom = 1, dt, fremax;
			let g1 = [], h1 = [], y1 = [], y2 = [], u1 = [], u2 = [];
			
			this.name = 'VibrateSystemVI';
			
			function inverse(n, a) {
				
				let i, j, k, e, f, b = [];
				for (i = 0; i <= n; i++) {
					b.push([]);
					for (j = 0; j <= n; j++) {
						b[i].push(0);
					}
					b[i][i] = 1;
				}
				for (i = 1; i <= n; i++) {
					for (j = i; j <= n; j++) {
						if (a[i][j] != 0) {
							for (k = 1; k <= n; k++) {
								e = a[i][k];
								a[i][k] = a[j][k];
								a[j][k] = e;
								e = b[i][k];
								b[i][k] = b[j][k];
								b[j][k] = e;
							}
							f = 1.0 / a[i][i];
							for (k = 1; k <= n; k++) {
								a[i][k] = f * a[i][k];
								b[i][k] = f * b[i][k];
							}
							for (j = 1; j <= n; j++) {
								if (j != i) {
									f = -a[j][i];
									for (k = 1; k <= n; k++) {
										a[j][k] = a[j][k] + f * a[i][k];
										b[j][k] = b[j][k] + f * b[i][k];
									}
								}
							}
						}
					}
				}
				for (i = 1; i <= n; i++) {
					for (j = 1; j <= n; j++) {
						a[i][j] = b[i][j];
					}
				}
			}
			
			function setInitData() {
				let i, j, l, x, y, z, ss = 0;
				let m = [], c = [], k = [], a = [], b = [], e = [], f = [];
				let m1 = [], c1 = [], k1 = [];
				
				for (i = 0; i < 8; i++) {
					
					y1[i] = 0;
					y2[i] = 0;
					u1[i] = 0;
					u2[i] = 0;
					m1[i] = 0;
					c1[i] = 0;
					k1[i] = 0;
				}
				m1[1] = 1;
				c1[1] = 10;
				k1[1] = 20;
				// 传递矩阵求模型最大频率
				dt = 1.0 / Fs;
				for (i = 0; i <= 2 * freedom; i++) {
					
					g1.push([]);
					h1.push([]);
					m.push([]);
					c.push([]);
					k.push([]);
					a.push([]);
					b.push([]);
					e.push([]);
					f.push([]);
					for (j = 0; j < 2 * freedom; j++) {
						
						g1[i].push(0);
						h1[i].push(0);
						m[i].push(0);
						c[i].push(0);
						k[i].push(0);
						a[i].push(0);
						b[i].push(0);
						e[i].push(0);
						f[i].push(0);
					}
				}
				for (i = 1; i <= freedom; i++) {
					for (j = 1; j <= freedom; j++) {
						m[i][j] = 0;
						c[i][j] = 0;
						k[i][j] = 0;
					}
					m[i][i] = m1[i];
					c[i][i - 1] = -c1[i];
					c[i][i] = c1[i] + c1[i + 1];
					c[i][i + 1] = -c1[i + 1];
					k[i][i - 1] = -k1[i];
					k[i][i] = k1[i] + k1[i + 1];
					k[i][i + 1] = -k1[i + 1];
				}
				for (i = 1; i <= freedom; i++) {
					for (j = 1; j <= freedom; j++) {
						g1[i][j] = k[i][j];
					}
				}
				
				//******************************************************************
				inverse(freedom, g1);
				//******************************************************************
				for (i = 1; i <= freedom; i++) {
					for (j = 1; j <= freedom; j++) {
						h1[i][j] = g1[i][j] * m[j][j];
					}
				}
				
				for (i = 1; i <= freedom; i++) {
					m1[i] = 1;
				}
				for (i = 1; i <= freedom; i++) {
					c1[i] = 0;
					for (j = 1; j <= freedom; j++) {
						c1[i] += m1[j] * h1[i][j];
					}
				}
				for (j = 1; j <= freedom; j++) {
					m1[j] = c1[j];
					if (c1[freedom] != 0) {
						m1[j] = c1[j] / c1[freedom];
					}
				}
				for (i = 1; i <= freedom; i++) {
					ss = ss + m1[i] * m1[i] * m[i][i];
				}
				ss = Math.sqrt(ss);
				for (i = 1; i <= freedom; i++) {
					m1[i] = m1[i] / ss;
				}
				for (i = 1; i <= freedom; i++) {
					for (j = 1; j <= freedom; j++) {
						g1[i][j] = c1[freedom] * m1[i] * m1[j] * m[j][j];
						h1[i][j] -= g1[i][j];
					}
				}
				fremax = Math.sqrt(1.0 / Math.abs(c1[freedom])) / 2 * Math.PI;
				
				//==生成状态空间矩阵=====================================================
				for (i = 1; i <= freedom; i++) {
					for (j = 1; j <= freedom; j++) {
						a[i][j] = 0;
						a[i][j + freedom] = m[i][j];
						a[i + freedom][j] = m[i][j];
						a[i + freedom][j + freedom] = c[i][j];
						b[i][j] = -m[i][j];
						b[i][j + freedom] = 0;
						b[i + freedom][j] = 0;
						b[i + freedom][j + freedom] = k[i][j];
					}
				}
				i = 2 * freedom;
				//*********************************************************************
				inverse(i, a);//g.inverse(i,a);
				//*********************************************************************
				//   return;
				for (i = 1; i <= 2 * freedom; i++) {
					for (j = 1; j <= 2 * freedom; j++) {
						e[i][j] = 0;
						for (l = 1; l <= 2 * freedom; l++) {
							e[i][j] = e[i][j] - a[i][l] * b[l][j];
						}
					}
				}
				for (x = 1; x <= 2 * freedom; x++) {
					for (y = 1; y <= 2 * freedom; y++) {
						g1[x][y] = 0;
						f[x][y] = 0;
					}
					f[x][x] = 1;
				}
				//求E^At
				for (i = 1; i < 20; i++) {
					for (x = 1; x <= 2 * freedom; x++) {
						for (y = 1; y <= 2 * freedom; y++) {
							g1[x][y] = g1[x][y] + f[x][y];
						}
					}
					for (x = 1; x <= 2 * freedom; x++) {
						for (y = 1; y <= 2 * freedom; y++) {
							h1[x][y] = 0;
							for (z = 1; z <= 2 * freedom; z++) {
								h1[x][y] = h1[x][y] + e[x][z] * f[z][y];
							}
							h1[x][y] = h1[x][y] * dt / i;
						}
					}
					for (x = 1; x <= 2 * freedom; x++) {
						for (y = 1; y <= 2 * freedom; y++) {
							f[x][y] = h1[x][y];
						}
					}
				}
				for (x = 1; x <= 2 * freedom; x++) {
					for (y = 1; y <= 2 * freedom; y++) {
						h1[x][y] = 0;
						for (z = 1; z <= 2 * freedom; z++) {
							h1[x][y] = h1[x][y] + g1[x][z] * a[z][y];
						}
					}
				}
			}
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				if (this.index === 0) {
					setInitData();
				}
				let i, j;
				//计算过程
				u2[freedom + 1] = inputTemp;
				for (i = 1; i <= 2 * freedom; i++) {
					y2[i] = 0;
					for (j = 1; j <= 2 * freedom; j++) {
						y2[i] = y2[i] + g1[i][j] * y1[j] + h1[i][j] * (u1[j] + u2[j]) * 0.5 * dt;
					}
				}
				for (i = 1; i <= 2 * freedom; i++) {
					u1[i] = u2[i];
					y1[i] = y2[i];
				}
				//输出值
				let outputTemp = y2[1 + freedom];
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.reset = function () {
				
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
		}
		
		static get cnName() {
			
			return 'n自由度振动系统';
		}
	},
	
	RelayVI: class RelayVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			this.name = 'RelayVI';
			
			this.setData = function (input) {
				
				let tempInput = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(tempInput)) {
					
					return false;
				}
				
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = tempInput;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = tempInput;
				}
				return tempInput;
			};
			
			this.draw();
		}
		
		static get cnName() {
			
			return '存储器';
		}
	},
	
	SignalGeneratorVI: class SignalGeneratorVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let timeStamp = 0, point = {}, checkClickTimer = null;
			let dataTip = $('');
			let signalName = ['正弦波', '方波', '三角波', '白噪声'];
			
			this.name = 'SignalGeneratorVI';
			this.inputPointCount = 2;
			this.phase = 0;
			this.amp = 1;
			this.frequency = 256;
			this.signalType = 1;
			
			//多输入选择弹出框
			this.inputBoxTitle = '请选择信号发生器输入参数';
			this.inputBoxContent = '<div class="input-div">' +
				'<div><input type="radio" id="type1" class="radio-input" name="input-type" value="1" alt="幅值">' +
				'<label class="input-label" for="type1">幅值</label></div>' +
				'<div><input type="radio" id="type2" class="radio-input" name="input-type" value="2" alt="频率">' +
				'<label class="input-label" for="type2">频率</label></div></div>';
			
			//VI双击弹出框
			this.boxTitle = '请选择信号类型';
			this.boxContent = '<div class="input-div">' +
				'<div><input type="radio" id="type1" class="radio-input" name="SignalGeneratorVI-type" value="1">' +
				'<label class="input-label" for="type1">正弦波</label></div>' +
				'<div><input type="radio" id="type2" class="radio-input" name="SignalGeneratorVI-type" value="2">' +
				'<label class="input-label" for="type2">方波</label></div>' +
				'<div><input type="radio" id="type3" class="radio-input" name="SignalGeneratorVI-type" value="3">' +
				'<label class="input-label" for="type3">三角波</label></div>' +
				'<div><input type="radio" id="type4" class="radio-input" name="SignalGeneratorVI-type" value="4">' +
				'<label class="input-label" for="type4">白噪声</label></div></div>';
			
			this.updater = function () {
				
				if (this.sourceInfoArray.length > 0) {
					
					for (let sourceInfo of this.sourceInfoArray) {
						
						let sourceVI = VILibrary.InnerObjects.getVIById(sourceInfo[0]);
						let sourceOutputType = sourceInfo[1];
						let inputType = sourceInfo[2];
						let sourceData = sourceVI.getData(sourceOutputType);
						this.setData(sourceData, inputType);
					}
					//更新完幅值频率后刷新一遍数据
					this.setData();
				}
			};
			
			// 采样频率为11025Hz
			this.setData = function (input, inputType) {
				
				if (inputType === 1) {
					
					let temp = Number(Array.isArray(input) ? input[input.length - 1] : input);
					if (Number.isNaN(temp)) {
						
						console.log('SignalGeneratorVI: Input value error');
						return false;
					}
					this.amp = temp;
				}
				else if (inputType === 2) {
					
					let temp = Number(Array.isArray(input) ? input[input.length - 1] : input);
					if (Number.isNaN(temp)) {
						
						console.log('SignalGeneratorVI: Input value error');
						return false;
					}
					this.frequency = temp;
				}
				else {
					
					if (Number.isNaN(this.amp) || Number.isNaN(this.frequency) || Number.isNaN(this.phase)) {
						
						return false;
					}
					let FS = 11025;
					let i, j;
					let T = 1 / this.frequency;//周期
					let dt = 1 / FS;//采样周期
					let t, t1, t2, t3;
					
					if (this.frequency <= 0) {
						
						for (i = 0; i < this.dataLength; i += 1) {
							
							this.output[i] = 0;
						}
						return this.output;
					}
					
					switch (parseInt(this.signalType)) {
						case 1://正弦波
							for (i = 0; i < this.dataLength; i += 1) {
								
								this.output[i] = this.amp * Math.sin(2 * Math.PI * this.frequency * i * dt + (2 * Math.PI * this.phase) / 360);
							}
							break;
						
						case 2://方波
							t1 = T / 2;//半周期时长
							t3 = T * this.phase / 360.0;
							for (i = 0; i < this.dataLength; i += 1) {
								
								t = i * dt + t3;
								t2 = t - Math.floor(t / T) * T;
								if (t2 >= t1) {
									
									this.output[i] = -this.amp;
								}
								else {
									
									this.output[i] = this.amp;
								}
							}
							break;
						
						case 3://三角波
							t3 = T * this.phase / 360.0;
							for (i = 0; i < this.dataLength; i += 1) {
								
								t = i * dt + t3;
								t2 = parseInt(t / T);
								t1 = t - t2 * T;
								if (t1 <= T / 2) {
									this.output[i] = 4 * this.amp * t1 / T - this.amp;
								}
								else {
									this.output[i] = 3 * this.amp - 4 * this.amp * t1 / T;
								}
							}
							break;
						
						case 4://白噪声
							t2 = 32767;// 0 -- 0x7fff
							for (i = 0; i < this.dataLength; i += 1) {
								t1 = 0;
								for (j = 0; j < 12; j += 1) {
									
									t1 += (t2 * Math.random());
								}
								this.output[i] = this.amp * (t1 - 6 * t2) / (3 * t2);
							}
							break;
						
						default://正弦波
							for (i = 0; i < this.dataLength; i += 1) {
								
								this.output[i] = this.amp * Math.sin(2 * Math.PI * this.frequency * i * dt + (2 * Math.PI * this.phase) / 360);
							}
					}
					this.phase += 10;
				}
			};
			
			this.setInitialData = function () {
				
				this.setSignalType(Number($('input[name=SignalGeneratorVI-type]:checked').val()));
			};
			
			this.setSignalType = function (type) {
				
				if (isNaN(type)) {
					return false;
				}
				this.signalType = type;
				this.setData();
				//全局更新一次
				if (this.dataLine) {
					
					VILibrary.InnerObjects.dataUpdater(this.dataLine);
				}
				
			};
			
			this.draw();
			
			this.container.addEventListener('mousedown', function (e) {
				
				timeStamp = e.timeStamp;
				point.x = e.clientX;
				point.y = e.clientY;
			}, false);
			this.container.addEventListener('mouseup', function (e) {
				
				//X、Y移动距离小于5，点击间隔小于200，默认点击事件
				if ((e.timeStamp - timeStamp) < 200 && (point.x - e.clientX) < 5 && (point.y - e.clientY) < 5) {
					
					if (_this.dataLine) {
						
						clearTimeout(checkClickTimer);
						checkClickTimer = setTimeout(function () {
							
							_this.toggleObserver(!_this.timer);
						}, 250);
					}
				}
			}, false);
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">信号类型:' + signalName[_this.signalType - 1] + '</span>' +
					'<span class="normal-span">幅值:' + _this.amp.toFixed(2) + '</span>' +
					'<span class="normal-span">频率:' + _this.frequency.toFixed(2) + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
			
			//重写双击事件，先去除模版VI旧的绑定再添加新的
			this.container.removeEventListener('dblclick', this.handleDblClick);
			this.handleDblClick = function (e) {
				
				clearTimeout(checkClickTimer);
				VILibrary.InnerObjects.showBox(_this);
			};
			this.container.addEventListener('dblclick', this.handleDblClick, false);
		}
		
		static get cnName() {
			
			return '信号发生器';
		}
	},
	
	BallBeamVI: class BallBeamVI extends TemplateVI {
		
		constructor(VICanvas, draw3DFlag) {
			
			super(VICanvas);
			
			const _this = this;
			
			let camera, scene, renderer, controls, markControl, switchControl, resetControl,
				base, beam, ball, mark, offButton, onButton, resetButton;
			let dataTip = $('');
			
			this.name = 'BallBeamVI';
			this.Fs = 50;
			this.markPosition = 0;  //记录标记移动位置
			this.PIDAngle = 0;
			this.PIDPosition = 0;
			this.limit = true;
			this.angle1 = 0;
			this.angle2 = 0;
			this.position1 = 0;
			this.position2 = 0;
			this.angelOutput = [0];
			this.positionOutput = [0];
			
			//多输出选择弹出框
			this.outputBoxTitle = '请选择球杆模型输出参数';
			this.outputBoxContent = '<div class="input-div">' +
				'<div><input type="radio" id="type1" class="radio-input" name="output-type" value="1">' +
				'<label class="input-label" for="type1">反馈角度</label></div>' +
				'<div><input type="radio" id="type2" class="radio-input" name="output-type" value="2">' +
				'<label class="input-label" for="type2">反馈位置</label></div>' +
				'<div><input type="radio" id="type3" class="radio-input" name="output-type" value="3">' +
				'<label class="input-label" for="type3">标记位置</label></div></div>';
			
			this.toggleObserver = function (flag) {
				
				if (flag) {
					
					if (!this.timer && this.dataLine) {
						
						markControl.detach(mark);
						scene.remove(offButton);
						switchControl.detach(offButton);
						scene.add(onButton);
						switchControl.attach(onButton);
						this.timer = window.setInterval(function () {
							
							VILibrary.InnerObjects.dataUpdater(_this.dataLine);
						}, 50);
					}
				}
				else {
					
					if (this.timer) {
						
						window.clearInterval(this.timer);
						this.timer = 0;
					}
					markControl.attach(mark);
					scene.remove(onButton);
					switchControl.detach(onButton);
					scene.add(offButton);
					switchControl.attach(offButton);
				}
			};
			/**
			 * 三维绘图
			 */
			function ballBeamDraw() {
				
				renderer = new THREE.WebGLRenderer({canvas: _this.container, antialias: true});
				renderer.setClearColor(0x6495ED);
				renderer.setSize(_this.container.clientWidth, _this.container.clientHeight);
				
				camera = new THREE.PerspectiveCamera(30, _this.container.clientWidth / _this.container.clientHeight, 1, 100000);
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
					
					_this.toggleObserver(!_this.timer);
				});
				
				//重置
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
					_this.reset();
				});
				
				scene.add(base);
				scene.add(beam);
				scene.add(ball);
				scene.add(mark);
				scene.add(offButton);
				scene.add(resetButton);
				markControl.attach(mark);
				switchControl.attach(offButton);
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
				if (this.focused.position.x < -120) {
					
					this.focused.position.x = -120;
				}
				else if (this.focused.position.x > 120) {
					
					this.focused.position.x = 120;
				}
				_this.markPosition = parseInt(this.focused.position.x);
			}
			
			window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
				|| window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
			
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
				mark.position.y = _this.markPosition * Math.sin(angle);
				mark.position.x = _this.markPosition * Math.cos(angle);
			}
			
			/**
			 *
			 * @param input 输入端口读取角度
			 */
			this.setData = function (input) {
				
				let inputAngle = Number(Array.isArray(input) ? input[input.length - 1] : input);
				
				if (Number.isNaN(inputAngle)) {
					
					console.log('BallBeamVI: Input value error');
					return;
				}
				let outputPosition, Ts = 1 / this.Fs, angleMax = 100 * Ts;
				if (this.limit) {
					if ((inputAngle - this.PIDAngle) > angleMax) {
						
						inputAngle = this.PIDAngle + angleMax;
					}
					if ((this.PIDAngle - inputAngle) > angleMax) {
						
						inputAngle = this.PIDAngle - angleMax;
					}
					if (inputAngle > 30) {
						
						inputAngle = 30;
					}
					if (inputAngle < -30) {
						
						inputAngle = -30;
					}
				}
				
				this.PIDAngle = inputAngle;//向输出端口上写数据
				
				outputPosition = this.position1 + 0.5 * Ts * (inputAngle + this.angle1);
				this.angle1 = inputAngle;
				this.position1 = outputPosition;
				inputAngle = outputPosition;
				outputPosition = this.position2 + 0.5 * Ts * (inputAngle + this.angle2);
				this.angle2 = inputAngle;
				this.position2 = outputPosition;
				
				outputPosition = outputPosition < -120 ? -120 : outputPosition;
				outputPosition = outputPosition > 120 ? 120 : outputPosition;
				this.PIDPosition = parseFloat(outputPosition).toFixed(2);//向输出端口上写数据
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.angelOutput[this.index] = this.PIDAngle;
					this.positionOutput[this.index] = this.PIDPosition;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						this.angelOutput[i] = this.angelOutput[i + 1];
						this.positionOutput[i] = this.positionOutput[i + 1];
					}
					this.angelOutput[this.dataLength - 1] = this.PIDAngle;
					this.positionOutput[this.dataLength - 1] = this.PIDPosition;
				}
				setPosition(this.PIDAngle * Math.PI / 180, this.PIDPosition);
			};
			
			this.getData = function (dataType) {
				
				if (dataType === 1) {
					
					return this.angelOutput;  //输出角度数组
				}
				if (dataType === 2) {
					
					return this.positionOutput;  //输出位置数组
					
				}
				if (dataType === 3) {
					
					return this.markPosition;  //输出标记位置
				}
			};
			
			this.reset = function () {
				
				this.toggleObserver(false);
				this.PIDAngle = 0;
				this.PIDPosition = 0;
				this.angelOutput = [0];
				this.positionOutput = [0];
				this.limit = true;
				this.angle1 = 0;
				this.angle2 = 0;
				this.position1 = 0;
				this.position2 = 0;
				this.index = 0;
				this.markPosition = 0;
				setPosition(0, 0);
			};
			
			this.draw = function () {
				
				if (draw3DFlag) {
					
					let loadingImg = document.createElement('img');
					loadingImg.src = 'img/loading.gif';
					loadingImg.style.width = '64px';
					loadingImg.style.height = '64px';
					loadingImg.style.position = 'absolute';
					loadingImg.style.top = this.container.offsetTop + this.container.offsetHeight / 2 - 32 + 'px';
					loadingImg.style.left = this.container.offsetLeft + this.container.offsetWidth / 2 - 32 + 'px';
					loadingImg.style.zIndex = '10001';
					this.container.parentNode.appendChild(loadingImg);
					
					let promiseArr = [
						VILibrary.InnerObjects.loadModule('assets/BallBeamControl/base.mtl', 'assets/BallBeamControl/base.obj'),
						VILibrary.InnerObjects.loadModule('assets/BallBeamControl/beam.mtl', 'assets/BallBeamControl/beam.obj'),
						VILibrary.InnerObjects.loadModule('assets/BallBeamControl/ball.mtl', 'assets/BallBeamControl/ball.obj'),
						VILibrary.InnerObjects.loadModule('assets/BallBeamControl/mark.mtl', 'assets/BallBeamControl/mark.obj'),
						VILibrary.InnerObjects.loadModule('assets/BallBeamControl/offButton.mtl', 'assets/BallBeamControl/offButton.obj'),
						VILibrary.InnerObjects.loadModule('assets/BallBeamControl/resetButton.mtl', 'assets/BallBeamControl/resetButton.obj'),
						VILibrary.InnerObjects.loadModule('assets/BallBeamControl/onButton.mtl', 'assets/BallBeamControl/onButton.obj')
					];
					Promise.all(promiseArr).then(function (objArr) {
						
						base = objArr[0];
						beam = objArr[1];
						ball = objArr[2];
						mark = objArr[3];
						offButton = objArr[4];
						resetButton = objArr[5];
						onButton = objArr[6];
						loadingImg.style.display = 'none';
						ballBeamDraw();
					}).catch(e => console.log('BallBeanVIError: ' + e));
				}
				else {
					
					this.ctx = this.container.getContext("2d");
					let img = new Image();
					img.src = 'img/BallBeam.png';
					img.onload = function () {
						
						_this.ctx.drawImage(img, 0, 0, _this.container.width, _this.container.height);
					};
				}
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">标记位置:' + _this.markPosition + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '球杆模型';
		}
		
		static get defaultWidth() {
			
			return '550px';
		}
		
		static get defaultHeight() {
			
			return '300px';
		}
	},
	
	DoubleTankVI: class DoubleTankVI extends TemplateVI {
		
		constructor(VICanvas, draw3DFlag) {
			
			super(VICanvas);
			
			const _this = this;
			
			let camera, scene, renderer, controls, tank, sinkWater, tapWater1, tapWater2, tapWater3, tankWater1,
				tankWater2;
			let waterMaterial = new THREE.MeshBasicMaterial({color: 0x00a0e3, opacity: 0.9});
			let dataTip = $('');
			
			this.name = 'DoubleTankVI';
			this.Fs = 50;
			this.h1 = 0;
			this.h2 = 0;
			this.waterInput = 0;
			this.waterOutput1 = [0];    //水箱1流量输出
			this.waterOutput2 = [0];    //水箱2流量输出
			this.tankHeight1 = [0];    //水箱1水位高度
			this.tankHeight2 = [0];    //水箱2水位高度
			
			//多输出选择弹出框
			this.outputBoxTitle = '请选择双容水箱输出参数';
			this.outputBoxContent = '<div class="input-div">' +
				'<div><input type="radio" id="type1" class="radio-input" name="output-type" value="1">' +
				'<label class="input-label" for="type1">水箱1输出流量</label></div>' +
				'<div><input type="radio" id="type2" class="radio-input" name="output-type" value="2">' +
				'<label class="input-label" for="type2">水箱2输出流量</label></div>' +
				'<div><input type="radio" id="type3" class="radio-input" name="output-type" value="3">' +
				'<label class="input-label" for="type3">水箱1水位</label></div> ' +
				'<div><input type="radio" id="type4" class="radio-input" name="output-type" value="4">' +
				'<label class="input-label" for="type4">水箱2水位</label></div></div>';
			
			function setWater() {
				
				scene.remove(tapWater1);
				scene.remove(tankWater1);
				scene.remove(tapWater2);
				scene.remove(tankWater2);
				scene.remove(tapWater3);
				scene.remove(sinkWater);
				
				let h3 = 200 - (_this.h1 + _this.h2) / 10;
				sinkWater = new THREE.Mesh(new THREE.BoxGeometry(3180, h3, 1380), waterMaterial);
				sinkWater.position.x = 30;
				sinkWater.position.y = -900 + h3 / 2;
				scene.add(sinkWater);
				if (_this.waterInput > 0) {
					
					tapWater1 = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 800, 20), waterMaterial);
					tapWater1.position.x = -400;
					tapWater1.position.y = 600;
					
					scene.add(tapWater1);
				}
				
				if (_this.h1 > 0) {
					
					tankWater1 = new THREE.Mesh(new THREE.CylinderGeometry(290, 290, _this.h1, 50), waterMaterial);
					tankWater1.position.x = -200;
					tankWater1.position.y = _this.h1 / 2 + 200;
					
					tapWater2 = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 800, 20), waterMaterial);
					tapWater2.position.x = 400;
					tapWater2.position.y = -220;
					
					scene.add(tankWater1);
					scene.add(tapWater2);
				}
				
				if (_this.h2 > 0) {
					
					tankWater2 = new THREE.Mesh(new THREE.CylinderGeometry(290, 290, _this.h2, 50), waterMaterial);
					tankWater2.position.x = 600;
					tankWater2.position.y = _this.h2 / 2 - 620;
					
					tapWater3 = new THREE.Mesh(new THREE.CylinderGeometry(18, 18, 200, 20), waterMaterial);
					tapWater3.position.x = 1350;
					tapWater3.position.y = -900 + 200 / 2;
					
					scene.add(tankWater2);
					scene.add(tapWater3);
				}
			}
			
			function doubleTankDraw() {
				
				renderer = new THREE.WebGLRenderer({canvas: _this.container, antialias: true});
				renderer.setClearColor('wheat');
				renderer.setSize(_this.container.clientWidth, _this.container.clientHeight);
				
				camera = new THREE.PerspectiveCamera(30, _this.container.clientWidth / _this.container.clientHeight, 1, 100000);
				camera.position.z = 5000;
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
				
				tank.position.x = -500;
				tank.position.y = 1000;
				scene.add(tank);
				
				sinkWater = new THREE.Mesh(new THREE.BoxGeometry(3180, 200, 1380), waterMaterial);
				sinkWater.position.x = 30;
				sinkWater.position.y = -900 + 200 / 2;
				scene.add(sinkWater);
				
				animate();
				
				// window.addEventListener('resize', function () {
				//
				//     camera.aspect = domElement.clientWidth / domElement.clientHeight;
				//     camera.updateProjectionMatrix();
				//     renderer.setSize(domElement.clientWidth, domElement.clientHeight);
				// });
			}
			
			window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
				|| window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
			
			function animate() {
				
				window.requestAnimationFrame(animate);
				controls.update();
				
				renderer.render(scene, camera);
				
			}
			
			this.setData = function (input) {
				
				let waterInput = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(waterInput)) {
					
					return false;
				}
				waterInput = waterInput < 0 ? 0 : waterInput;
				
				let u11, u12, dh1, u21, u22, dh2;
				u11 = waterInput;
				u12 = Math.sqrt(2 * 9.8 * this.h1); //伯努利方程
				dh1 = (u11 - u12) / this.Fs;
				this.h1 = this.h1 + dh1;
				this.h1 = this.h1 > 800 ? 800 : this.h1;    //800为水箱高度
				this.waterInput = u11;
				
				u21 = Math.sqrt(2 * 9.8 * this.h1);
				u22 = Math.sqrt(2 * 9.8 * this.h2);
				dh2 = (u21 - u22) / this.Fs;
				this.h2 = this.h2 + dh2;
				this.h2 = this.h2 > 800 ? 800 : this.h2;    //800为水箱高度
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.waterOutput1[this.index] = u12;
					this.waterOutput2[this.index] = u22;
					this.tankHeight1[this.index] = this.h1;
					this.tankHeight2[this.index] = this.h2;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.waterOutput1[i] = this.waterOutput1[i + 1];
						this.waterOutput2[i] = this.waterOutput2[i + 1];
						this.tankHeight1[i] = this.tankHeight1[i + 1];
						this.tankHeight2[i] = this.tankHeight2[i + 1];
					}
					this.waterOutput1[this.dataLength - 1] = u12;
					this.waterOutput2[this.dataLength - 1] = u22;
					this.tankHeight1[this.dataLength - 1] = this.h1;
					this.tankHeight2[this.dataLength - 1] = this.h2;
				}
				setWater();
			};
			
			this.getData = function (dataType) {
				
				if (dataType === 1) {
					
					return this.waterOutput1;  //输出
				}
				if (dataType === 2) {
					
					return this.waterOutput2;  //输出
					
				}
				if (dataType === 3) {
					
					return this.tankHeight1;  //输出水箱1水位高度
				}
				if (dataType === 4) {
					
					return this.tankHeight2;  //输出水箱2水位高度
				}
			};
			
			this.reset = function () {
				
				this.toggleObserver(false);
				this.Fs = 50;
				this.h1 = 0;
				this.h2 = 0;
				this.index = 0;
				this.waterInput = 0;
				this.waterOutput1 = [0];
				this.waterOutput2 = [0];
				this.tankHeight1 = [0];
				this.tankHeight2 = [0];
				setWater();
			};
			
			this.draw = function () {
				
				if (draw3DFlag) {
					
					let loadingImg = document.createElement('img');
					loadingImg.src = 'img/loading.gif';
					loadingImg.style.width = '64px';
					loadingImg.style.height = '64px';
					loadingImg.style.position = 'absolute';
					loadingImg.style.top = this.container.offsetTop + this.container.offsetHeight / 2 - 32 + 'px';
					loadingImg.style.left = this.container.offsetLeft + this.container.offsetWidth / 2 - 32 + 'px';
					loadingImg.style.zIndex = '10001';
					this.container.parentNode.appendChild(loadingImg);
					
					VILibrary.InnerObjects.loadModule('assets/DoubleTank/tank.mtl', 'assets/DoubleTank/tank.obj')
						.then(function (obj) {
							
							tank = obj;
							loadingImg.style.display = 'none';
							doubleTankDraw();
						}).catch(e => console.log('DoubleTankVIError: ' + e));
				}
				else {
					
					this.ctx = this.container.getContext("2d");
					let img = new Image();
					img.src = 'img/BallBeam.png';
					img.onload = function () {
						
						_this.ctx.drawImage(img, 0, 0, _this.container.width, _this.container.height);
					};
				}
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">水箱1水位:' + _this.h1.toFixed(2) + '</span>' +
					'<span class="normal-span">水箱2水位:' + _this.h2.toFixed(2) + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '双容水箱';
		}
		
		static get defaultWidth() {
			
			return '550px';
		}
		
		static get defaultHeight() {
			
			return '300px';
		}
	},
	
	RotorExperimentalRigVI: class RotorExperimentalRigVI extends TemplateVI {
		
		constructor(VICanvas, draw3DFlag) {
			
			super(VICanvas);
			
			const _this = this;
			
			let camera, scene, renderer, controls, base, rotor, offSwitch, onSwitch, switchControl,
				phase = 0, sampleFrequency = 8192, dt = 1 / sampleFrequency;
			
			this.name = 'RotorExperimentalRigVI';
			this.signalType = 1;
			this.rotateSpeed = 2399;
			this.rotateFrequency = this.rotateSpeed / 60;  //旋转频率
			this.dataLength = 2048;
			this.signalOutput = [0];
			this.frequencyOutput = [0];
			this.orbitXOutput = [0];
			this.orbitYOutput = [0];
			
			//多输出选择弹出框
			this.outputBoxTitle = '请选择转子实验台输出参数';
			this.outputBoxContent = '<div class="input-div">' +
				'<div><input type="radio" id="type1" class="radio-input" name="output-type" value="1">' +
				'<label class="input-label" for="type1">时域信号</label></div>' +
				'<div><input type="radio" id="type2" class="radio-input" name="output-type" value="2">' +
				'<label class="input-label" for="type2">频域信号</label></div>' +
				'<div><input type="radio" id="type3" class="radio-input" name="output-type" value="3">' +
				'<label class="input-label" for="type3">轴心轨迹</label></div>' +
				'<div><input type="radio" id="type4" class="radio-input" name="output-type" value="4">' +
				'<label class="input-label" for="type4">旋转频率</label></div></div>';
			
			//VI双击弹出框
			this.boxTitle = '请设置输出信号类型';
			this.boxContent = '<div class="input-div">' +
				'<div><input type="radio" id="type1" class="radio-input" name="RotorExperimentalRigVI-type" value="1">' +
				'<label class="input-label" for="type1">转速信号</label></div>' +
				'<div><input type="radio" id="type2" class="radio-input" name="RotorExperimentalRigVI-type" value="2">' +
				'<label class="input-label" for="type2">加速度信号</label></div>' +
				'<div><input type="radio" id="type3" class="radio-input" name="RotorExperimentalRigVI-type" value="3">' +
				'<label class="input-label" for="type3">轴心位移X信号</label></div>' +
				'<div><input type="radio" id="type4" class="radio-input" name="RotorExperimentalRigVI-type" value="4">' +
				'<label class="input-label" for="type4">轴心位移Y信号</label></div></div>';
			
			this.toggleObserver = function (flag) {
				
				if (flag) {
					
					if (!this.timer) {
						
						scene.remove(offSwitch);
						switchControl.detach(offSwitch);
						scene.add(onSwitch);
						switchControl.attach(onSwitch);
						this.timer = window.setInterval(function () {
							
							phase += 36;
							generateData();
							
							rotor.rotation.x += 2 * Math.PI * _this.rotateSpeed / 10;
							//定时更新相同数据线VI的数据
							if (_this.dataLine) {
								
								VILibrary.InnerObjects.dataUpdater(_this.dataLine);
							}
						}, 100);
					}
				}
				else {
					
					if (this.timer) {
						
						window.clearInterval(this.timer);
						this.timer = 0;
					}
					scene.remove(onSwitch);
					switchControl.detach(onSwitch);
					scene.add(offSwitch);
					switchControl.attach(offSwitch);
				}
			};
			
			/**
			 *设置转速
			 * @param input 输入端口读取转速
			 */
			this.setData = function (input) {
				
				let temp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(temp)) {
					
					return false;
				}
				this.rotateSpeed = temp;
				this.rotateFrequency = this.rotateSpeed / 60;
			};
			
			this.setInitialData = function () {
				
				_this.signalType = Number($('input[name=RotorExperimentalRigVI-type]:checked').val());
			};
			
			this.getData = function (dataType) {
				
				if (dataType === 1) {
					
					return this.signalOutput;  //输出时域信号
					
				}
				if (dataType === 2) {
					
					return this.frequencyOutput;  //输出频域信号
					
				}
				if (dataType === 3) {
					
					return [this.orbitXOutput, this.orbitYOutput];  //输出轴心位置
					
				}
				if (dataType === 4) {
					
					return this.rotateFrequency;  //输出旋转频率
					
				}
			};
			
			function generateData() {
				
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
				_this.frequencyOutput = VILibrary.InnerObjects.fft(1, 11, _this.signalOutput);
			}
			
			/**
			 * 三维绘图
			 * @constructor
			 */
			function rotorExperimentalRigDraw() {
				
				renderer = new THREE.WebGLRenderer({
					canvas: _this.container,
					antialias: true
				});
				renderer.setClearColor(0x6495ED);
				renderer.setSize(_this.container.clientWidth, _this.container.clientHeight);
				
				camera = new THREE.PerspectiveCamera(30, _this.container.clientWidth / _this.container.clientHeight, 1, 100000);
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
					
					_this.toggleObserver(!_this.timer);
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
			
			window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame
				|| window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
			function rotorAnimate() {
				
				window.requestAnimationFrame(rotorAnimate);
				switchControl.update();
				controls.update();
				renderer.render(scene, camera);
				
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
					
					let loadingImg = document.createElement('img');
					loadingImg.src = 'img/loading.gif';
					loadingImg.style.width = '64px';
					loadingImg.style.height = '64px';
					loadingImg.style.position = 'absolute';
					loadingImg.style.top = this.container.offsetTop + this.container.offsetHeight / 2 - 32 + 'px';
					loadingImg.style.left = this.container.offsetLeft + this.container.offsetWidth / 2 - 32 + 'px';
					loadingImg.style.zIndex = '1001';
					this.container.parentNode.appendChild(loadingImg);
					
					let promiseArr = [
						VILibrary.InnerObjects.loadModule('assets/RotorExperimentalRig/base.mtl', 'assets/RotorExperimentalRig/base.obj'),
						VILibrary.InnerObjects.loadModule('assets/RotorExperimentalRig/rotor.mtl', 'assets/RotorExperimentalRig/rotor.obj'),
						VILibrary.InnerObjects.loadModule('assets/RotorExperimentalRig/offSwitch.mtl', 'assets/RotorExperimentalRig/offSwitch.obj'),
						VILibrary.InnerObjects.loadModule('assets/RotorExperimentalRig/onSwitch.mtl', 'assets/RotorExperimentalRig/onSwitch.obj')
					];
					Promise.all(promiseArr).then(function (objArr) {
						
						base = objArr[0];
						rotor = objArr[1];
						offSwitch = objArr[2];
						onSwitch = objArr[3];
						loadingImg.style.display = 'none';
						rotorExperimentalRigDraw();
					}).catch(e => console.log('BallBeanVIError: ' + e));
				}
				else {
					
					this.ctx = this.container.getContext("2d");
					let img = new Image();
					img.src = 'img/RotorExperimentalRig.png';
					img.onload = function () {
						
						_this.ctx.drawImage(img, 0, 0, _this.container.width, _this.container.height);
					};
				}
			};
			
			this.draw();
		}
		
		static get cnName() {
			
			return '转子实验台';
		}
		
		static get defaultWidth() {
			
			return '550px';
		}
		
		static get defaultHeight() {
			
			return '300px';
		}
	},
	
	TextVI: class TextVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			this.name = 'TextVI';
			this.ctx = this.container.getContext("2d");
			this.outputPointCount = 0;
			this.latestInput = 0;
			this.decimalPlace = 1;
			//VI双击弹出框
			this.boxTitle = '请输入保留小数位数';
			this.boxContent = '<div class="input-div">' +
				'<input type="number" id="TextVI-input" value="' + this.decimalPlace + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				this.latestInput = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(this.latestInput)) {
					
					return false;
				}
				
				let str = parseFloat(this.latestInput).toFixed(this.decimalPlace);
				this.ctx.font = "normal 12px Microsoft YaHei";
				this.ctx.fillStyle = 'orange';
				this.ctx.fillRect(0, 0, this.container.width, this.container.height);
				this.ctx.fillStyle = 'black';
				this.ctx.fillText(str, this.container.width / 2 - 6 * str.length, this.container.height / 2 + 6);
			};
			
			this.setDecimalPlace = function (decimalPlace) {
				
				this.decimalPlace = parseInt(decimalPlace);
				this.setData(this.latestInput);
				this.boxContent = '<div class="input-div">' +
					'<input type="number" id="TextVI-input" value="' + this.decimalPlace + '" class="normal-input"></div>';
			};
			
			this.setInitialData = function () {
				
				this.setDecimalPlace($('#TextVI-input').val());
			};
			
			this.reset = function () {
				
				this.latestInput = 0;
				this.decimalPlace = 1;
			};
			
			this.draw();
		}
		
		static get cnName() {
			
			return '文本显示';
		}
		
		static get defaultWidth() {
			
			return '100px';
		}
		
		static get defaultHeight() {
			
			return '40px';
		}
	},
	
	RoundPanelVI: class RoundPanelVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			
			this.name = 'RoundPanelVI';
			this.ctx = this.container.getContext("2d");
			this.outputPointCount = 0;
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
			this.fontSize = parseInt(16 * this.radius / 150);
			this.R = this.container.width > this.container.height ? this.container.height / 2 : this.container.width / 2;
			this.radius = this.R * 0.9;
			//VI双击弹出框
			this.boxTitle = '请设置初始参数';
			this.boxContent = '<div class="input-div">' +
				'<span class="normal-span">标题:</span><input type="text" id="RoundPanelVI-input-1" value="' + this.title + '" class="normal-input">' +
				'<span class="normal-span">单位:</span><input type="text" id="RoundPanelVI-input-2" value="' + this.unit + '" class="normal-input">' +
				'<span class="normal-span">最小值:</span><input type="number" id="RoundPanelVI-input-3" value="' + this.minValue + '" class="normal-input">' +
				'<span class="normal-span">最大值:</span><input type="number" id="RoundPanelVI-input-4" value="' + this.maxValue + '" class="normal-input"></div>';
			
			function parsePosition(angle) {
				
				let position = [];
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
				this.minValue = minVal;
				this.maxValue = maxVal;
				
				if (typeof unitText === 'string') {
					
					this.unit = unitText;
				}
				
				if (typeof titleText === 'string') {
					
					this.title = titleText;
				}
				this.draw();
				
				this.boxContent = '<div class="input-div">' +
					'<span class="normal-span">标题:</span><input type="text" id="RoundPanelVI-input-1" value="' + this.title + '" class="normal-input">' +
					'<span class="normal-span">单位:</span><input type="text" id="RoundPanelVI-input-2" value="' + this.unit + '" class="normal-input">' +
					'<span class="normal-span">最小值:</span><input type="number" id="RoundPanelVI-input-3" value="' + this.minValue + '" class="normal-input">' +
					'<span class="normal-span">最大值:</span><input type="number" id="RoundPanelVI-input-4" value="' + this.maxValue + '" class="normal-input"></div>';
			};
			
			this.setData = function (input) {
				
				this.latestInput = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(this.latestInput)) {
					
					return false;
				}
				this.latestInput = this.latestInput < this.minValue ? this.minValue : this.latestInput;
				this.latestInput = this.latestInput > this.maxValue ? this.maxValue : this.latestInput;
				this.latestInput = parseFloat(this.latestInput).toFixed(2);
				this.handAngle = Math.PI * 5 / 6 + this.latestInput / this.maxValue * this.panelRangeAngle;
				this.draw();
			};
			
			this.setInitialData = function () {
				
				let title = Number($('#RoundPanelVI-input-1').val());
				let unit = Number($('#RoundPanelVI-input-2').val());
				let minValue = Number($('#RoundPanelVI-input-3').val());
				let maxValue = Number($('#RoundPanelVI-input-4').val());
				this.setRange(minValue, maxValue, unit, title);
			};
			
			this.reset = function () {
				
				this.latestInput = 0;
			};
			this.drawHand = function () {
				
				this.ctx.save();
				// 位移到目标点
				this.ctx.translate(this.R, this.R);
				this.ctx.rotate(this.handAngle);
				this.ctx.moveTo(-this.radius * 0.05, 0);
				this.ctx.lineTo(0, -this.radius * 0.02);
				this.ctx.lineTo(this.radius * 0.75, 0);
				this.ctx.lineTo(0, this.radius * 0.02);
				this.ctx.lineTo(-this.radius * 0.05, 0);
				this.ctx.fillStyle = this.screenColor;
				this.ctx.fill();
				this.ctx.restore();
				
			};
			
			this.draw = function () {
				
				// 画出背景边框
				this.ctx.beginPath();
				this.ctx.arc(this.R, this.R, this.R, 0, 360, false);
				this.ctx.lineTo(this.R * 2, this.R);
				this.ctx.fillStyle = this.borderColor;//填充颜色
				this.ctx.fill();//画实心圆
				this.ctx.closePath();
				// 画出背景圆
				this.ctx.beginPath();
				this.ctx.arc(this.R, this.R, this.R * 0.97, 0, 360, false);
				this.ctx.fillStyle = this.bgColor;//填充颜色
				this.ctx.fill();//画实心圆
				this.ctx.closePath();
				// 保存
				this.ctx.save();
				// 位移到目标点
				this.ctx.translate(this.R, this.R);
				// 画出圆弧
				this.ctx.beginPath();
				this.ctx.arc(0, 0, this.radius * 0.98, Math.PI * 5 / 6, Math.PI / 6, false);
				this.ctx.arc(0, 0, this.radius, Math.PI / 6, Math.PI * 5 / 6, true);
				this.ctx.lineTo(this.radius * 0.98 * Math.cos(Math.PI * 5 / 6), this.radius * 0.98 * Math.sin(Math.PI * 5 / 6));
				this.ctx.restore();
				this.ctx.fillStyle = this.screenColor;
				this.ctx.fill();
				this.ctx.beginPath();
				this.ctx.lineCap = "round";
				this.ctx.lineWidth = 2;
				if (this.radius < 150) {
					
					this.ctx.lineWidth = 1;
				}
				this.ctx.strokeStyle = this.screenColor;
				let i, j;
				// 保存
				this.ctx.save();
				// 位移到目标点
				this.ctx.translate(this.R, this.R);
				
				let rotateAngle = Math.PI * 5 / 6, position, markStr, fontSize;
				this.ctx.font = 'normal ' + this.fontSize / 2 + 'px Microsoft YaHei';
				fontSize = /\d+/.exec(this.ctx.font)[0];
				for (i = 0; i <= this.bigSectionNum; i += 1) {
					
					this.ctx.save();
					this.ctx.rotate(rotateAngle);
					this.ctx.moveTo(this.radius * 0.99, 0);
					this.ctx.lineTo(this.radius * 0.9, 0);
					this.ctx.restore();
					
					if (this.R > 100) {
						for (j = 1; j < this.smallSectionNum; j += 1) {
							
							if (i == this.bigSectionNum) {
								break;
							}
							this.ctx.save();
							this.ctx.rotate(rotateAngle);
							this.ctx.rotate(j * this.panelRangeAngle / this.smallSectionNum / this.bigSectionNum);
							this.ctx.moveTo(this.radius * 0.99, 0);
							this.ctx.lineTo(this.radius * 0.95, 0);
							this.ctx.restore();
						}
						
						if (i > 0 && i < this.bigSectionNum) {
							
							markStr = dataFormation((this.maxValue - _thisminValue) / this.bigSectionNum * i + this.minValue);
							position = parsePosition(rotateAngle);
							this.ctx.fillText(markStr, position[0] - fontSize / 4 * markStr.length, position[1]);
						}
					}
					rotateAngle += this.panelRangeAngle / this.bigSectionNum;
				}
				markStr = dataFormation(this.minValue);
				position = parsePosition(Math.PI * 5 / 6);
				this.ctx.fillText(markStr, position[0] - fontSize / 4 * markStr.length, position[1]);
				markStr = dataFormation(this.maxValue);
				position = parsePosition(Math.PI * 5 / 6 + this.panelRangeAngle);
				this.ctx.fillText(markStr, position[0] - fontSize / 3 * markStr.length, position[1]);
				this.ctx.restore();
				
				this.ctx.font = 'bold ' + this.fontSize + 'px Microsoft YaHei';
				fontSize = /\d+/.exec(this.ctx.font)[0];
				markStr = this.latestInput.toString() + this.unit;
				this.ctx.fillText(markStr, this.R - fontSize / 4 * markStr.length, this.R * 3 / 2);
				markStr = this.title;
				this.ctx.fillText(markStr, this.R - fontSize / 4 * markStr.length, this.R * 1 / 2);
				this.ctx.stroke();
				this.ctx.closePath();
				this.drawHand();
			};
			
			this.draw();
		}
		
		static get cnName() {
			
			return '圆表盘';
		}
		
		static get defaultWidth() {
			
			return '150px';
		}
		
		static get defaultHeight() {
			
			return '150px';
		}
	},
	
	BarVI: class BarVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			
			this.name = 'BarVI';
			this.ctx = this.container.getContext("2d");
			this.outputPointCount = 0;
			this.labelX = [];
			this.maxValY = 100;
			this.minValY = 0;
			this.autoZoom = true;
			this.pointNum = 100;
			this.drawRulerFlag = true;
			//网格矩形四周边距 TOP RIGHT BOTTOM LEFT//
			this.offsetT = 10;
			this.offsetR = 10;
			this.offsetB = 10;
			this.offsetL = 10;
			if ((this.container.height >= 200) && (this.container.width >= 200)) {
				
				this.offsetB = 35;
				this.offsetL = 42;
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
			
			this.setData = function (data) {
				
				if (!Array.isArray(data)) {
					
					console.log('BarVI: input type error');
					return false;
				}
				this.pointNum = data.length > this.pointNum ? data.length : this.pointNum;
				
				let YMax = 0, YMin = 0, i;
				for (i = 0; i < this.pointNum; i += 1) {
					
					this.bufferVal[i] = data[i] == undefined ? 0 : data[i];
					YMax = YMax < this.bufferVal[i] ? this.bufferVal[i] : YMax;
					YMin = YMin > this.bufferVal[i] ? this.bufferVal[i] : YMin;
				}
				if (this.autoZoom) {
					
					this.setAxisRangY(YMin, 1.2 * YMax);
				}
				this.ratioX = this.waveWidth / this.pointNum;
				this.ratioY = this.waveHeight / (this.maxValY - this.minValY);
				this.draw();
			};
			
			this.draw = function () {
				
				this.drawBackground();
				this.drawWave();
				if (this.drawRulerFlag) {
					
					this.drawRuler();
				}
			};
			
			this.drawWave = function () {
				
				let i, barHeight, x, y;
				//绘制柱状图
				for (i = 0; i < this.pointNum; i += 1) {
					
					x = this.offsetL + i * this.ratioX;
					barHeight = this.bufferVal[i] * this.ratioY;
					y = this.offsetT + this.waveHeight - barHeight;
					this.ctx.beginPath();
					this.ctx.fillStyle = this.signalColor;
					this.ctx.fillRect(x + 0.1 * this.ratioX, y, this.ratioX * 0.8, barHeight);
					this.ctx.closePath();
				}
			};
			
			this.drawBackground = function () {
				
				let ctx = this.ctx;
				//刷背景//
				ctx.beginPath();
				/* 将这个渐变设置为fillStyle */
				// ctx.fillStyle = grad;
				ctx.fillStyle = this.bgColor;
				ctx.lineWidth = 3;
				ctx.strokeStyle = "RGB(25, 25, 25)";
				ctx.fillRect(0, 0, this.container.width, this.container.height);
				ctx.strokeRect(3, 3, this.container.width - 6, this.container.height - 6);
				ctx.closePath();
				
				//画网格矩形边框和填充
				ctx.beginPath();
				ctx.fillStyle = this.screenColor;
				ctx.lineWidth = 1;
				ctx.strokeStyle = 'RGB(0, 0, 0)';
				ctx.fillRect(this.offsetL, this.offsetT, this.waveWidth, this.waveHeight);
				ctx.strokeRect(this.offsetL, this.offsetT, this.waveWidth, this.waveHeight);
				ctx.closePath();
				
				//网格行数
				let nRow = this.container.height / 50;
				let divY = this.waveHeight / nRow;
				
				ctx.beginPath();
				ctx.lineWidth = 1;
				ctx.lineCap = "round";
				ctx.strokeStyle = this.gridColor;
				
				let i;
				//绘制横向网格线
				for (i = 1; i < nRow; i += 1) {
					
					ctx.moveTo(this.offsetL, divY * i + this.offsetT);
					ctx.lineTo(this.container.width - this.offsetR, divY * i + this.offsetT);
				}
				ctx.stroke();
				ctx.closePath();
				
				if ((this.container.height >= 200) && (this.container.width >= 200)) {
					
					//绘制横纵刻度
					let scaleYNum = this.container.height / 50;
					let scaleXNum = this.container.width / 50;
					let scaleYStep = this.waveHeight / scaleYNum;
					let scaleXStep = this.waveWidth / scaleXNum;
					ctx.beginPath();
					ctx.lineWidth = 1;
					ctx.strokeStyle = this.fontColor;
					//画纵刻度
					let k;
					for (k = 2; k <= scaleYNum; k += 2) {
						
						ctx.moveTo(this.offsetL - 6, this.offsetT + k * scaleYStep);
						ctx.lineTo(this.offsetL, this.offsetT + k * scaleYStep);
						
					}
					// //画横刻度
					// for (k = 0; k < scaleXNum; k += 2) {
					//
					//
					//     ctx.moveTo(this.offsetL + k * scaleXStep, this.offsetT + this.waveHeight);
					//     ctx.lineTo(this.offsetL + k * scaleXStep, this.offsetT + this.waveHeight + 7);
					//
					// }
					ctx.stroke();
					ctx.closePath();
					////////////////画数字字体////////////////
					ctx.font = "normal 12px Calibri";
					
					let valStepX = this.pointNum / scaleXNum;
					let valStepY = (this.maxValY - this.minValY) / scaleYNum;
					
					ctx.fillStyle = this.fontColor;
					let temp = 0;
					if (this.labelX.length < this.pointNum) {
						
						for (i = 0; i < this.pointNum; i += 1) {
							
							this.labelX[i] = i;
						}
					}
					//横坐标刻度//
					for (i = 0; i < scaleXNum; i += 2) {
						
						temp = this.labelX[parseInt(valStepX * i)];
						ctx.fillText(VILibrary.InnerObjects.fixNumber(temp), this.offsetL + scaleXStep * i - 9 + this.ratioX / 2, this.container.height - 10);
					}
					//纵坐标刻度//
					for (i = 2; i <= scaleYNum; i += 2) {
						
						temp = this.maxValY - valStepY * i;
						
						ctx.fillText(VILibrary.InnerObjects.fixNumber(temp), this.offsetL - 35, this.offsetT + scaleYStep * i + 5);
					}
					ctx.closePath();
					ctx.save();
				}
			};
			
			this.drawBackground();
			
			this.drawRuler = function () {
				
				//是否缝隙间不绘制标尺
				// if ((this.curPointX + 0.1 * this.ratioX - this.offsetL ) % this.ratioX < 0.2 * this.ratioX) {
				//
				//     return;
				// }
				
				if (this.curPointX >= (this.container.width - this.offsetR)) {
					return;
				}
				//画标尺//
				this.ctx.beginPath();
				this.ctx.lineWidth = 1;
				this.ctx.lineCap = "round";
				this.ctx.strokeStyle = this.rulerColor;
				this.ctx.font = "normal 14px Calibri";
				this.ctx.fillStyle = this.rulerColor;
				
				//竖标尺//
				this.ctx.moveTo(this.curPointX + 0.5, this.offsetT);
				this.ctx.lineTo(this.curPointX + 0.5, this.container.height - this.offsetB);
				this.ctx.stroke();
				let curPointX = parseInt((this.curPointX - this.offsetL + this.ratioX / 2) * this.pointNum / this.waveWidth);
				curPointX = curPointX === this.pointNum ? curPointX - 1 : curPointX;
				let curPointY = VILibrary.InnerObjects.fixNumber(this.bufferVal[curPointX]);
				this.ctx.fillText('(' + this.labelX[curPointX] + ',' + curPointY + ')',
					this.container.width - this.curPointX < 80 ? this.curPointX - 80 : this.curPointX + 4, this.offsetT + 15);
				this.ctx.closePath();
			};
			
			this.reset = function () {
				
				this.bufferVal = [];
				this.drawBackground();
			};
			
			this.setAxisRangY = function (yMin, yMax) {
				
				this.minValY = yMin;
				this.maxValY = yMax;
				this.drawBackground();
			};
			
			this.setAxisX = function (labelX) {
				
				this.labelX = labelX;
				this.drawBackground();
			};
			
			this.setPointNum = function (num) {
				
				this.pointNum = num;
				this.drawBackground();
			};
			
			this.setLabel = function (xLabel, yLabel) {
				
				this.strLabelX = xLabel;
				this.strLabelY = yLabel;
				this.drawBackground();
			};
			
			this.setRowColNum = function (row, col) {
				
				this.nRow = row;
				this.nCol = col;
				this.drawBackground();
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
			
			function onMouseMove(event) {
				
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
		}
		
		static get cnName() {
			
			return '柱状图';
		}
		
		static get defaultWidth() {
			
			return '500px';
		}
		
		static get defaultHeight() {
			
			return '250px';
		}
	},
	
	WaveVI: class WaveVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			
			this.name = 'WaveVI';
			this.ctx = this.container.getContext("2d");
			this.outputPointCount = 0;
			//坐标单位//
			this.strLabelX = 'X';
			this.strLabelY = 'Y';
			//坐标数值//
			this.maxValX = 1023;
			this.minValX = 0;
			this.maxValY = 10;
			this.minValY = -10;
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
				
				this.drawBackground();
				this.drawWave();
				if (this.drawRulerFlag) {
					
					this.drawRuler();
				}
			};
			
			this.drawWave = function () {
				
				let ratioX = this.waveWidth / (this.pointNum - 1);
				let ratioY = this.waveHeight / (this.maxValY - this.minValY);
				let pointX = [];
				let pointY = [];
				
				let i;
				for (i = 0; i < this.pointNum; i += 1) {
					
					pointX[i] = this.offsetL + i * ratioX;
					pointY[i] = this.offsetT + (this.maxValY - this.bufferVal[i]) * ratioY;
					if (pointY[i] < this.offsetT) {
						
						pointY[i] = this.offsetT;
					}
					if (pointY[i] > (this.offsetT + this.waveHeight)) {
						
						pointY[i] = this.offsetT + this.waveHeight;
					}
				}
				//绘制波形曲线
				this.ctx.beginPath();
				this.ctx.lineWidth = 2;
				this.ctx.lineCap = "round";
				this.ctx.strokeStyle = this.signalColor;
				this.ctx.moveTo(pointX[0], pointY[0]);
				for (i = 1; i < this.pointNum; i += 1) {
					
					this.ctx.lineTo(pointX[i], pointY[i]);
				}
				this.ctx.stroke();
				this.ctx.closePath();
				this.ctx.save();
			};
			
			this.drawBackground = function () {
				
				let ctx = this.ctx;
				//刷背景//
				ctx.beginPath();
				/* 将这个渐变设置为fillStyle */
				// ctx.fillStyle = grad;
				ctx.fillStyle = this.bgColor;
				ctx.lineWidth = 3;
				ctx.strokeStyle = "RGB(25, 25, 25)";
				ctx.fillRect(0, 0, this.container.width, this.container.height);
				ctx.strokeRect(3, 3, this.container.width - 6, this.container.height - 6);
				ctx.closePath();
				
				//画网格矩形边框和填充
				ctx.beginPath();
				ctx.fillStyle = this.screenColor;
				ctx.lineWidth = 1;
				ctx.strokeStyle = this.gridColor;
				ctx.fillRect(this.offsetL, this.offsetT, this.waveWidth, this.waveHeight);
				ctx.strokeRect(this.offsetL + 0.5, this.offsetT + 0.5, this.waveWidth, this.waveHeight);
				ctx.closePath();
				
				let nRow = this.nRow;
				let nCol = this.nCol;
				let divX = this.waveWidth / nCol;
				let divY = this.waveHeight / nRow;
				
				ctx.beginPath();
				ctx.lineWidth = 1;
				ctx.lineCap = "round";
				ctx.strokeStyle = this.gridColor;
				
				let i, j;
				//绘制横向网格线
				for (i = 1; i < nRow; i += 1) {
					
					ctx.moveTo(this.offsetL, divY * i + this.offsetT);
					ctx.lineTo(this.container.width - this.offsetR, divY * i + this.offsetT);
				}
				//绘制纵向网格线
				for (j = 1; j < nCol; j += 1) {
					
					ctx.moveTo(divX * j + this.offsetL, this.offsetT);
					ctx.lineTo(divX * j + this.offsetL, this.container.height - this.offsetB);
				}
				ctx.stroke();
				ctx.closePath();
				
				if ((this.container.height >= 200) && (this.container.width >= 200)) {
					
					let scaleYNum = 8;
					let scaleXNum = 16;
					let scaleYStep = this.waveHeight / scaleYNum;
					let scaleXStep = this.waveWidth / scaleXNum;
					
					////////////////画数字字体////////////////
					ctx.font = "normal 12px Calibri";
					
					let strLab;
					//横标签//
					strLab = this.strLabelX;
					ctx.fillText(strLab, this.container.width - this.offsetR - strLab.length * 6 - 10, this.container.height - this.offsetB + 20);
					
					//纵标签//
					strLab = this.strLabelY;
					ctx.fillText(strLab, strLab.length * 6, this.offsetT + 12);
					
					let valStepX = (this.maxValX - this.minValX) / scaleXNum;
					let valStepY = (this.maxValY - this.minValY) / scaleYNum;
					
					ctx.fillStyle = this.fontColor;
					let temp = 0;
					//横坐标刻度//
					for (i = 2; i < scaleXNum; i += 2) {
						
						temp = this.minValX + valStepX * i;
						ctx.fillText(VILibrary.InnerObjects.fixNumber(temp), this.offsetL + scaleXStep * i - 9, this.container.height - 12);
					}
					//纵坐标刻度//
					for (i = 2; i < scaleYNum; i += 2) {
						
						temp = this.maxValY - valStepY * i;
						ctx.fillText(VILibrary.InnerObjects.fixNumber(temp), this.offsetL - 28, this.offsetT + scaleYStep * i + 5);
					}
					ctx.closePath();
					ctx.save();
				}
			};
			
			this.drawBackground();
			
			this.drawRuler = function () {
				
				//画标尺//
				this.ctx.beginPath();
				this.ctx.lineWidth = 1;
				this.ctx.lineCap = "round";
				this.ctx.strokeStyle = this.rulerColor;
				this.ctx.font = "normal 14px Calibri";
				this.ctx.fillStyle = this.rulerColor;
				
				//竖标尺//
				this.ctx.moveTo(this.curPointX + 0.5, this.offsetT);
				this.ctx.lineTo(this.curPointX + 0.5, this.container.height - this.offsetB);
				this.ctx.stroke();
				let curPointX = parseFloat((this.curPointX - this.offsetL) * (this.maxValX - this.minValX) / this.waveWidth)
					.toFixed(2);
				let curPointY = parseFloat(this.bufferVal[parseInt((this.curPointX - this.offsetL) * this.pointNum / this.waveWidth)])
					.toFixed(2);
				this.ctx.fillText('(' + curPointX + ',' + curPointY + ')',
					this.container.width - this.curPointX < 80 ? this.curPointX - 80 : this.curPointX + 4, this.offsetT + 15);
				this.ctx.closePath();
			};
			
			this.reset = function () {
				
				this.bufferVal = [];
				this.drawBackground();
			};
			
			this.setData = function (data) {
				
				if (!Array.isArray(data)) {
					
					console.log('WaveVI: input type error');
					return false;
				}
				this.pointNum = data.length > this.pointNum ? data.length : this.pointNum;
				let YMax = 0, YMin = 0, i;
				for (i = 0; i < this.pointNum; i += 1) {
					
					this.bufferVal[i] = data[i] == undefined ? 0 : data[i];
					YMax = YMax < this.bufferVal[i] ? this.bufferVal[i] : YMax;
					YMin = YMin > this.bufferVal[i] ? this.bufferVal[i] : YMin;
				}
				if (this.autoZoom) {
					
					if ((this.maxValY <= YMax) || (this.maxValY - YMax > 5 * (YMax - YMin))) {
						
						this.maxValY = 2 * YMax - YMin;
						this.minValY = 2 * YMin - YMax;
					}
					if ((this.minValY >= YMin) || (YMin - this.maxValY > 5 * (YMax - YMin))) {
						
						this.maxValY = 2 * YMax - YMin;
						this.minValY = 2 * YMin - YMax;
					}
					if (YMax < 0.01 && YMin > -0.01) {
						
						this.maxValY = 1;
						this.minValY = -1;
					}
				}
				this.draw();
			};
			
			this.setAxisRangX = function (xMin, xNax) {
				
				this.minValX = xMin;
				this.maxValX = xNax;
				this.drawBackground();
			};
			
			this.setAxisRangY = function (yMin, yMax) {
				
				this.minValY = yMin;
				this.maxValY = yMax;
				this.drawBackground();
			};
			
			this.setPointNum = function (num) {
				
				this.pointNum = num;
				this.drawBackground();
			};
			
			this.setLabel = function (xLabel, yLabel) {
				
				this.strLabelX = xLabel;
				this.strLabelY = yLabel;
				this.drawBackground();
			};
			
			this.setRowColNum = function (row, col) {
				
				this.nRow = row;
				this.nCol = col;
				this.drawBackground();
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
			
			function onMouseMove(event) {
				
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
			
		}
		
		static get cnName() {
			
			return '波形显示';
		}
		
		static get defaultWidth() {
			
			return '500px';
		}
		
		static get defaultHeight() {
			
			return '300px';
		}
	},
	
	OrbitWaveVI: class OrbitWaveVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			
			this.name = 'OrbitWaveVI';
			this.ctx = this.container.getContext("2d");
			this.outputPointCount = 0;
			
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
			if ((this.container.height >= 200) && (this.container.width >= 200)) {
				
				this.offsetB = 25 + this.borderWidth;
				this.offsetL = 38 + this.borderWidth;
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
						ctx.fillText(VILibrary.InnerObjects.fixNumber(temp), _this.offsetL + scaleXStep * i - 9, _this.container.height - 10);
					}
					//纵坐标刻度//
					for (i = 2; i < scaleYNum; i += 4) {
						
						temp = _this.MaxVal - yValStep * i;
						ctx.fillText(VILibrary.InnerObjects.fixNumber(temp), _this.offsetL - 30, _this.offsetT + scaleYStep * i + 5);
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
			
			function onMouseMove(event) {
				
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
			
		}
		
		static get cnName() {
			
			return '二维波形';
		}
		
		static get defaultWidth() {
			
			return '400px';
		}
		
		static get defaultHeight() {
			
			return '370px';
		}
	},
	
	ButtonVI: class ButtonVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			
			let timeStamp = 0, point = {};
			
			this.name = 'ButtonVI';
			this.ctx = this.container.getContext("2d");
			this.outputPointCount = 0;
			
			this.draw();
			
			this.container.addEventListener('mousedown', function (e) {
				
				timeStamp = e.timeStamp;
				point.x = e.clientX;
				point.y = e.clientY;
			}, false);
			
			this.container.addEventListener('mouseup', function (e) {
				
				//X、Y移动距离小于5，点击间隔小于200，默认点击事件
				if ((e.timeStamp - timeStamp) < 200 && (point.x - e.clientX) < 5 && (point.y - e.clientY) < 5) {
					
					if (_this.dataLine) {
						
						_this.toggleObserver(!_this.timer);
					}
				}
			}, false);
		}
		
		static get cnName() {
			
			return '开关';
		}
		
		static get defaultWidth() {
			
			return '100px';
		}
	},
	
	ProportionResponseVI: class ProportionResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'ProportionResponseVI';
			this.k1 = 1.5;
			//VI双击弹出框
			this.boxTitle = '比例响应';
			this.boxContent = '<div class="input-div"><span class="normal-span">K1:</span>' +
				'<input type="number" id="ProportionResponseVI-input" value="' + this.k1 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let temp1 = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(temp1)) {
					
					return false;
				}
				
				let temp2 = this.k1 * temp1;
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = temp2;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = temp2;
				}
			};
			
			this.setInitialData = function () {
				
				this.k1 = Number($('#ProportionResponseVI-input').val());
				this.boxContent = '<div class="input-div"><span class="normal-span">K1:</span>' +
					'<input type="number" id="ProportionResponseVI-input" value="' + this.k1 + '" class="normal-input"></div>';
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k1:' + _this.k1 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '比例响应';
		}
	},
	
	IntegrationResponseVI: class IntegrationResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'IntegrationResponseVI';
			this.k2 = 5;
			this.Fs = 1000;
			this.lastInput = 0;
			this.temp1 = 0;
			//VI双击弹出框
			this.boxTitle = '积分响应';
			this.boxContent = '<div class="input-div"><span class="normal-span">K2:</span>' +
				'<input type="number" id="IntegrationResponseVI-input" value="' + this.k2 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				let v2, v21;
				
				v21 = this.temp1 + 0.5 * (inputTemp + this.lastInput) / this.Fs;
				this.temp1 = v21;
				v2 = this.k2 * v21;
				
				let outputTemp = v2;
				this.lastInput = inputTemp;
				
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setInitialData = function () {
				
				this.k2 = Number($('#IntegrationResponseVI-input').val());
				this.boxContent = '<div class="input-div"><span class="normal-span">K2:</span>' +
					'<input type="number" id="IntegrationResponseVI-input" value="' + this.k2 + '" class="normal-input"></div>';
			};
			
			this.reset = function () {
				this.lastInput = 0;
				this.temp1 = 0;
				this.index = 0;
				this.output = [0];
			};
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k2:' + _this.k2 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '积分响应';
		}
	},
	
	DifferentiationResponseVI: class DifferentiationResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'DifferentiationResponseVI';
			this.k3 = 0.0025;
			this.Fs = 1000;
			this.lastInput = 0;
			//VI双击弹出框
			this.boxTitle = '微分响应';
			this.boxContent = '<div class="input-div"><span class="normal-span">K3:</span>' +
				'<input type="number" id="DifferentiationResponseVI-input" value="' + this.k3 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				let outputTemp = this.k3 * (inputTemp - this.lastInput) * this.Fs;
				this.lastInput = inputTemp;
				
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setInitialData = function () {
				
				this.k3 = Number($('#DifferentiationResponseVI-input').val());
				this.boxContent = '<div class="input-div"><span class="normal-span">K3:</span>' +
					'<input type="number" id="DifferentiationResponseVI-input" value="' + this.k3 + '" class="normal-input"></div>';
			};
			
			this.reset = function () {
				
				this.lastInput = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k3:' + _this.k3 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '微分响应';
		}
	},
	
	InertiaResponseVI: class InertiaResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'InertiaResponseVI';
			this.k1 = 0.025;
			this.Fs = 1000;
			this.temp1 = 0;
			//VI双击弹出框
			this.boxTitle = '惯性响应';
			this.boxContent = '<div class="input-div"><span class="normal-span">K1:</span>' +
				'<input type="number" id="InertiaResponseVI-input" value="' + this.k1 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				let v, E;
				
				//一阶 1/(TS+1)
				E = Math.exp(-1 / (this.k1 * this.Fs));
				v = E * this.temp1 + (1.0 - E) * inputTemp;
				this.temp1 = v;
				let outputTemp = v;//输出
				
				if (this.index <= (this.dataLength - 1)) {
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setInitialData = function () {
				
				this.k1 = Number($('#InertiaResponseVI-input').val());
				this.boxContent = '<div class="input-div"><span class="normal-span">K1:</span>' +
					'<input type="number" id="InertiaResponseVI-input" value="' + this.k1 + '" class="normal-input"></div>';
			};
			
			this.reset = function () {
				
				this.temp1 = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k1:' + _this.k1 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '惯性响应';
		}
	},
	
	OscillationResponseVI: class OscillationResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'OscillationResponseVI';
			this.k1 = 50;
			this.k2 = 0.05;
			this.Fs = 1000;
			this.temp1 = 0;
			this.temp2 = 0;
			//VI双击弹出框
			this.boxTitle = '震荡响应';
			this.boxContent = '<div class="input-div">' +
				'<span class="normal-span">K1:</span><input type="number" id="OscillationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
				'<span class="normal-span">K2:</span><input type="number" id="OscillationResponseVI-input-2" value="' + this.k2 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				let v, a1, b1;
				
				//二阶 W^2/(S^2+2gWS+W^2)
				if (this.k2 > 1) {
					
					this.k2 = 1;
				}
				b1 = Math.exp(-2 * 6.28 * this.k1 * this.k2 / this.Fs);
				a1 = 2 * Math.exp(-6.28 * this.k1 * this.k2 / this.Fs) * Math.cos(6.28 * this.k1 * Math.sqrt(1 - this.k2 * this.k2) / this.Fs);
				v = a1 * this.temp1 - b1 * this.temp2 + 1 * (1 - a1 + b1) * inputTemp;
				this.temp2 = this.temp1;
				this.temp1 = v;
				let outputTemp = v;//输出
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setInitialData = function () {
				
				this.k1 = Number($('#OscillationResponseVI-input-1').val());
				this.k2 = Number($('#OscillationResponseVI-input-2').val());
				this.boxContent = '<div class="input-div">' +
					'<span class="normal-span">K1:</span><input type="number" id="OscillationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
					'<span class="normal-span">K2:</span><input type="number" id="OscillationResponseVI-input-2" value="' + this.k2 + '" class="normal-input"></div>';
			};
			
			this.reset = function () {
				
				this.temp1 = 0;
				this.temp2 = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k1:' + _this.k1 + '</span>' +
					'<span class="normal-span">k2:' + _this.k2 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '震荡响应';
		}
	},
	
	ProportionIntegrationResponseVI: class ProportionIntegrationResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'ProportionIntegrationResponseVI';
			this.k1 = 1.5;
			this.k2 = 1;
			this.Fs = 1000;
			this.lastInput = 0;
			this.temp1 = 0;
			//VI双击弹出框
			this.boxTitle = '比例积分响应';
			this.boxContent = '<div class="input-div">' +
				'<span class="normal-span">K1:</span><input type="number" id="ProportionIntegrationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
				'<span class="normal-span">K2:</span><input type="number" id="ProportionIntegrationResponseVI-input-2" value="' + this.k2 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				let v1, v2, v21;
				
				v1 = this.k1 * inputTemp;
				
				v21 = this.temp1 + 0.5 * (inputTemp + this.lastInput) / this.Fs;
				this.temp1 = v21;
				v2 = this.k2 * v21;
				
				let outputTemp = v1 + v2;
				this.lastInput = inputTemp;
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setInitialData = function () {
				
				this.k1 = Number($('#ProportionIntegrationResponseVI-input-1').val());
				this.k2 = Number($('#ProportionIntegrationResponseVI-input-2').val());
				this.boxContent = '<div class="input-div">' +
					'<span class="normal-span">K1:</span><input type="number" id="ProportionIntegrationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
					'<span class="normal-span">K2:</span><input type="number" id="ProportionIntegrationResponseVI-input-2" value="' + this.k2 + '" class="normal-input"></div>';
			};
			
			this.reset = function () {
				
				this.lastInput = 0;
				this.temp1 = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k1:' + _this.k1 + '</span>' +
					'<span class="normal-span">k2:' + _this.k2 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '比例积分响应';
		}
	},
	
	ProportionDifferentiationResponseVI: class ProportionDifferentiationResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'ProportionDifferentiationResponseVI';
			this.k1 = 1;
			this.k3 = 0.0025;
			this.Fs = 1000;
			this.lastInput = 0;
			//VI双击弹出框
			this.boxTitle = '比例微分响应';
			this.boxContent = '<div class="input-div">' +
				'<span class="normal-span">K1:</span><input type="number" id="ProportionDifferentiationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
				'<span class="normal-span">K3:</span><input type="number" id="ProportionDifferentiationResponseVI-input-2" value="' + this.k3 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				let v1, v3;
				
				v1 = this.k1 * inputTemp;
				
				v3 = this.k3 * (inputTemp - this.lastInput) * this.Fs;
				
				let outputTemp = v1 + v3;
				this.lastInput = inputTemp;
				
				//将输出数保存在数组内
				let i = 0;
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setInitialData = function () {
				
				this.k1 = Number($('#ProportionDifferentiationResponseVI-input-1').val());
				this.k3 = Number($('#ProportionDifferentiationResponseVI-input-2').val());
				this.boxContent = '<div class="input-div">' +
					'<span class="normal-span">K1:</span><input type="number" id="ProportionDifferentiationResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
					'<span class="normal-span">K3:</span><input type="number" id="ProportionDifferentiationResponseVI-input-2" value="' + this.k3 + '" class="normal-input"></div>';
			};
			
			this.reset = function () {
				
				this.lastInput = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k1:' + _this.k1 + '</span>' +
					'<span class="normal-span">k3:' + _this.k3 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '比例微分响应';
		}
	},
	
	ProportionInertiaResponseVI: class ProportionInertiaResponseVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'ProportionInertiaResponseVI';
			this.k1 = 0.025;
			this.k2 = 1;
			this.Fs = 1000;
			this.temp1 = 0;
			//VI双击弹出框
			this.boxTitle = '比例惯性响应';
			this.boxContent = '<div class="input-div">' +
				'<span class="normal-span">K1:</span><input type="number" id="ProportionInertiaResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
				'<span class="normal-span">K2:</span><input type="number" id="ProportionInertiaResponseVI-input-2" value="' + this.k2 + '" class="normal-input"></div>';
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				
				let v, E;
				
				//一阶 X+1/(TS+1)
				E = Math.exp(-1 / (this.k1 * this.Fs));
				v = E * this.temp1 + (1.0 - E) * inputTemp;
				this.temp1 = v;
				let outputTemp = v + this.k2 * inputTemp;//输出
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setInitialData = function () {
				
				this.k1 = Number($('#ProportionInertiaResponseVI-input-1').val());
				this.k2 = Number($('#ProportionInertiaResponseVI-input-2').val());
				this.boxContent = '<div class="input-div">' +
					'<span class="normal-span">K1:</span><input type="number" id="ProportionInertiaResponseVI-input-1" value="' + this.k1 + '" class="normal-input">' +
					'<span class="normal-span">K2:</span><input type="number" id="ProportionInertiaResponseVI-input-2" value="' + this.k2 + '" class="normal-input"></div>';
			};
			
			this.reset = function () {
				
				this.temp1 = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k1:' + _this.k1 + '</span>' +
					'<span class="normal-span">k2:' + _this.k2 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '比例惯性响应';
		}
	},
	
	StepResponseGeneratorVI: class StepResponseGeneratorVI extends TemplateVI {
		
		constructor(VICanvas) {
			
			super(VICanvas);
			
			const _this = this;
			let dataTip = $('');
			
			this.name = 'StepResponseGeneratorVI';
			this.signalType = 0;
			this.k1 = 1;
			this.k2 = 1;
			this.k3 = 1;
			this.Fs = 1000;
			this.input = 0;
			this.lastInput = 0;
			this.temp1 = 0;
			this.temp2 = 0;
			
			this.setData = function (input) {
				
				let inputTemp = Number(Array.isArray(input) ? input[input.length - 1] : input);
				if (Number.isNaN(inputTemp)) {
					
					return false;
				}
				let v, v1, v2, v21, v3, E, a1, b1, outputTemp = 0;
				
				if (this.signalType < 6) {
					v1 = this.k1 * inputTemp;
					
					v21 = this.temp1 + 0.5 * (inputTemp + this.lastInput) / this.Fs;
					this.temp1 = v21;
					v2 = this.k2 * v21;
					
					v3 = this.k3 * (inputTemp - this.lastInput) * this.Fs;
					
					outputTemp = v1 + v2 + v3;
					this.lastInput = inputTemp;
				}
				else if (this.signalType < 9) {
					
					if (this.signalType == 6) { //一阶 1/(TS+1)
						
						E = Math.exp(-1 / (this.k1 * this.Fs));
						v = E * this.temp1 + (1.0 - E) * inputTemp;
						this.temp1 = v;
						outputTemp = v;//输出
					}
					if (this.signalType == 7) { //二阶 W^2/(S^2+2gWS+W^2)
						
						if (this.k2 > 1) {
							
							this.k2 = 1;
						}
						b1 = Math.exp(-2 * 6.28 * this.k1 * this.k2 / this.Fs);
						a1 = 2 * Math.exp(-6.28 * this.k1 * this.k2 / this.Fs) * Math.cos(6.28 * this.k1 * Math.sqrt(1 - this.k2 * this.k2) / this.Fs);
						v = a1 * this.temp1 - b1 * this.temp2 + 1 * (1 - a1 + b1) * inputTemp;
						this.temp2 = this.temp1;
						this.temp1 = v;
						outputTemp = v;//输出
					}
					if (this.signalType == 8) { //一阶 X+1/(TS+1)
						
						E = Math.exp(-1 / (this.k1 * this.Fs));
						v = E * this.temp1 + (1.0 - E) * inputTemp;
						this.temp1 = v;
						outputTemp = v + this.k2 * inputTemp;//输出
					}
				}
				
				//将输出数保存在数组内
				if (this.index <= (this.dataLength - 1)) {
					
					this.output[this.index] = outputTemp;
					this.index += 1;
				}
				else {
					
					let i;
					for (i = 0; i < this.dataLength - 1; i += 1) {
						this.output[i] = this.output[i + 1];
					}
					this.output[this.dataLength - 1] = outputTemp;
				}
			};
			
			this.setStepType = function (type) {
				
				this.signalType = type;
				
				//PID控制器
				if (this.signalType == 0) {
					this.k1 = 1;
					this.k2 = 1;
					this.k3 = 1;
				}
				
				//比例控制器
				if (this.signalType == 1) {
					this.k1 = 1;
					this.k2 = 0;
					this.k3 = 0;
				}
				
				//积分控制器
				if (this.signalType == 2) {
					this.k1 = 0;
					this.k2 = 1;
					this.k3 = 0;
				}
				
				//微分控制器
				if (this.signalType == 3) {
					this.k1 = 0;
					this.k2 = 0;
					this.k3 = 1;
				}
				
				//比例积分控制器
				if (this.signalType == 4) {
					this.k1 = 1;
					this.k2 = 1;
					this.k3 = 0;
				}
				
				//比例微分控制器
				if (this.signalType == 5) {
					this.k1 = 1;
					this.k2 = 0;
					this.k3 = 1;
				}
				
				//惯性环节
				if (this.signalType == 6) {
					this.k1 = 1;
					this.k2 = 0;
				}
				
				//振荡环节
				if (this.signalType == 7) {
					this.k1 = 1;
					this.k2 = 1;
				}
				
				//比例惯性环节
				if (this.signalType == 8) {
					this.k1 = 1;
					this.k2 = 1;
				}
				
			};
			
			this.reset = function () {
				
				this.lastInput = 0;
				this.temp1 = 0;
				this.temp2 = 0;
				this.index = 0;
				this.output = [0];
			};
			
			this.draw();
			
			this.container.addEventListener('mousemove', function (e) {
				//************************************数据提示****************************************//
				dataTip.remove();
				dataTip = $('<div class="rowFlex-div dataTip">' +
					'<span class="normal-span">k1:' + _this.k1 + '</span>' +
					'<span class="normal-span">k2:' + _this.k2 + '</span>' +
					'<span class="normal-span">k3:' + _this.k3 + '</span></div>');
				
				if (e.target.parentElement.id === 'VIContainer') {
					
					$(e.target.parentElement).append(dataTip);
				}
				else {
					dataTip.css('position', 'fixed');
					dataTip.css('top', '0');
					dataTip.css('left', '0');
					dataTip.css('z-index', '100');
					dataTip.css('width', '100%');
					$('body').prepend(dataTip);
				}
			}, false);
			this.container.addEventListener('mouseout', function () {
				dataTip.remove();
			}, false);
		}
		
		static get cnName() {
			
			return '阶跃响应';
		}
	}
};