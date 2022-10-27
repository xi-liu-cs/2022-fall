(function() {
	
	Vector = function(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
	
	Vector.prototype = {
		add: function(v) {
			return Vector.create(this.x + v.x, this.y + v.y, this.z + v.z);
		},
		substract: function(v) {
			return Vector.create(this.x - v.x, this.y - v.y, this.z - v.z);
		},
		multiply: function(n) {
			return Vector.create(this.x * n, this.y * n, this.z * n);
		},
		divide: function(n) {
			return Vector.create(this.x / n, this.y / n, this.z / n);
		},
		dot: function(v) {     // 点乘
			return this.x * v.x + this.y * v.y + this.z * v.z;
		},
		cross: function(v) {       //叉乘
			return Vector.create(
				this.y * v.z - this.z * v.y,
				this.z * v.x - this.x * v.z,
				this.x * v.y - this.y * v.x
			);
		},
		length: function() {
			return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
		},
		normalize: function() {
			var len = this.length();
			return Vector.create(
				this.x / len,
				this.y / len,
				this.z / len
			);
		},
		toString: function() {
			return "x:" + this.x + "\ny:" + this.y + "\nz:" + this.z;
		}
	};
	
	Vector.create = function(x, y, z) {
		return new Vector(x, y, z);
	};
	
})();