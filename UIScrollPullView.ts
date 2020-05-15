
import { GameUIEvent } from "../../../support/enum/GameEvent";


/**
 * scrollview 下拉或左右拉 逐次加载数据
 */
const { ccclass, property } = cc._decorator;
@ccclass
export class UIScrollPullView extends cc.Component {

	private _nextPageIndx: number = -1;  //后面的页数

	private pullStart: boolean = false;

	private startTouchPos: cc.Vec2 = null;

	/**
	 * 是否监听上下左右拉动加载
	 */
	private _listenTop: boolean = false;
	private _listenBottom: boolean = false;
	private _listenLeft: boolean = false;
	private _listenRight: boolean = false;
	// private _readyPull : boolean = false;

	private _pullCompleteCall: Function = null;

	private _scrollViewNode: cc.Node = null;

	@property({
		type: cc.Node,
	})
	private pullLoadNode: cc.Node = null;

	//转圈节点
	@property({
		type: cc.Node,
	})
	rotateNode: cc.Node = null

	//提示文字
	@property({
		type: cc.Label,
	})
	refreshLabel: cc.Label = null


	/////////////////////////////////////////////////////////////////////

	onLoad() {
		if (CC_EDITOR) {
			return;
		}
		if (this.pullLoadNode) {
			this.pullLoadNode.active = false;
		}
		EventCenter.addListener(GameUIEvent.UpdatePullLoad, this._updatePageInfo, this)
	}


	protected onDestroy() {
		EventCenter.removeListener(GameUIEvent.UpdatePullLoad, this);
	}

	/**
	 * 下拉完成后添加新的item的回调
	 */
	public initHandler(pullCompleteCall) {
		this._pullCompleteCall = pullCompleteCall
	}


	/**
	 * 更新当前页面index
	 * @param cur 
	 * @param next 
	 */
	public uptatePageIndex (next) {
		// this._currentPageIndx = cur;
		this._nextPageIndx = next;

	}

	/**
	 * 注册下拉事件监听
	 * @param bottom 
	 * @param left 
	 * @param right 
	 */
	public addListener(top, bottom, left, right) {
		this._scrollViewNode = this.node.parent;
		this._listenTop = top;
		this._listenBottom = bottom;
		this._listenLeft = left;
		this._listenRight = right;
		this._setRefresh();
		if (top) {
			this._scrollViewNode.on("bounce-top", (event)=>{
				if (Math.abs(event._autoScrollTargetDelta.y)>50 && this.pullStart) {
					this._getMsg();
				}
			})
			this._scrollViewNode.on("scroll-to-top", (event) => {
				this.pullStart = true;
			}, this)
		}
		if (bottom) {
			this._scrollViewNode.on("bounce-bottom", (event)=>{
				if (Math.abs(event._autoScrollTargetDelta.y)>50 && this.pullStart) {
					this._getMsg();
				}
			})
			this._scrollViewNode.on("scroll-to-bottom", (event) => {
				this.pullStart = true;
			}, this)
		}
		if (left) {
			this._scrollViewNode.on("bounce-left", (event)=>{
				if (Math.abs(event._autoScrollTargetDelta.x)>50 && this.pullStart) {
				
					this._getMsg();
				}
			})
			this._scrollViewNode.on("scroll-to-left", (event) => {
				this.pullStart = true;
			}, this)
		}
		if (right) {
			this._scrollViewNode.on("bounce-right", (event)=>{
				if (Math.abs(event._autoScrollTargetDelta.x)>50 && this.pullStart) {
	
					this._getMsg();
				}
			})
			this._scrollViewNode.on("scroll-to-right", (event) => {
				this.pullStart = true;
			}, this)
		}
		// this._setRefresh();
	}

	/**
	 * 
	 * @param list 新的数据
	 * @param init 是否是初始化调用
	 * @param nextPageIndex 下一页idx
	 */
	public _updatePageInfo(list, init , nextPageIndex) {
			this.uptatePageIndex( nextPageIndex)
			if (init) {
				if (this.pullLoadNode.active) {
					this._scrollViewNode.getComponent(cc.ScrollView).enabled = true;
					this._stopRotate();
					this.pullLoadNode.active = false;
					this.rotateNode.rotation = 0;
				}
				return;
			} 
			//延迟0.5秒后结束转圈
			TimerCenter.addListener(0.5, () => {
					this._scrollViewNode.getComponent(cc.ScrollView).enabled = true;
					this._stopRotate();
					this.pullLoadNode.active = false;
					this.rotateNode.rotation = 0;
					if (this._pullCompleteCall) {
						this._pullCompleteCall(list);
					}
			})
	}



	/**
	 * 刷新提示初始化
	 * eventStr 监听的事件
	 */
	private _setRefresh() {

		this._scrollViewNode.on(cc.Node.EventType.TOUCH_MOVE, (event) => {
			if (this.pullStart) {
				if (this._nextPageIndx == -1) {
					this.pullLoadNode.active = true;
					this.refreshLabel.string = "NO MORE MESSAGES";
					this.rotateNode.active = false;
				} else {
					if (!this.startTouchPos) {
						this.startTouchPos = cc.v2(event.touch._point.x, event.touch._point.y)
						this.rotateNode.active = true;
						this.refreshLabel.string = "PULL UP TO LOAD MORE";
					}

					let offsetX = event.touch._point.x - this.startTouchPos.x;
					let offsetY = event.touch._point.y - this.startTouchPos.y;
					let pulling = false;
					let offset = 0;

					if ((this._listenTop && offsetY < 0) || (this._listenBottom && offsetY > 0)) {
						pulling = true;
						offset = offsetY
					} else if ((this._listenLeft && offsetX > 0) || (this._listenRight && offsetX <0)) {
						pulling = true;
						offset = offsetX
					}
					if (pulling) {
						this.pullLoadNode.active = true;
						this.rotateNode.rotation = offset;
					} else {
						this.pullLoadNode.active = false;
					}
				}
			}
		}, this)

		this._scrollViewNode.on(cc.Node.EventType.TOUCH_CANCEL, (event) => {
			if (this.pullStart ) {
				// this._readyPull = true;
				this.pullStart = false;
				this.startTouchPos = null;
				if (this._nextPageIndx == -1) {
					this.pullLoadNode.active = false;
					this.rotateNode.rotation = 0;
				}
			}
		}, this)

		this._scrollViewNode.on(cc.Node.EventType.TOUCH_END, (event) => {
			if (this.pullStart ) {
				// this._readyPull = true;
				this.pullStart = false;
				this.startTouchPos = null;
				if (this._nextPageIndx == -1) {
					this.pullLoadNode.active = false;
					this.rotateNode.rotation = 0;
				}
			}

		}, this)
	}

	/**
	 * 拉取更多消息
	 */
	private _getMsg() {
		// -1 表示没有下一页了
		if (this._nextPageIndx == -1) {
			return
		}
		this._scrollViewNode.getComponent(cc.ScrollView).enabled = false;
		this._autoRotate();
		// 发送加载更多事件 
		EventCenter.sendEvent(GameUIEvent.PullLoadMore,this._nextPageIndx);
	}

	/**
	 * 加载时转圈
	 */
	private _autoRotate() {
		let rotate = cc.rotateBy(1, 360);
		rotate.easing(cc.easeInOut(1.5))
		this.rotateNode.runAction(cc.sequence(rotate, cc.callFunc(() => {
			this._autoRotate();
		})))
	}

	public _stopRotate() {
		this.rotateNode.stopAllActions();
	}

}