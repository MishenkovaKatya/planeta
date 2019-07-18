function es(data,fcsLen) {
	var smoothArr = [];
	smoothArr[0] = data[0];
	var N = data.length;
	var a = 2/(N+1); 

	var i;
	for (i = 1; i < N; i++) {
		smoothArr[i]=a*data[i-1]+(1-a)*smoothArr[i-1];
	};

	var j;
	for (j = N; j < (N + fcsLen); j++) {
		smoothArr[j]=a*data[j-1]+(1-a)*smoothArr[j-1];
		data[j]=smoothArr[j-1];
	};
	return smoothArr;
}