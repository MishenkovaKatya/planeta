function ss(data,fcsLen) {
	var smoothArr = [];
	var smoothWin = 3;
	var N = data.length;
	smoothArr[0]=null;

	var i,j;

	for (i = 0; i < N-2; i++) {
		smoothArr[i+1]=(data[i]+data[i+1]+data[i+2])/smoothWin;
	};

	for (j = N; j < N+fcsLen; j++) {
		smoothArr[j]=smoothArr[j-2]+1/smoothWin*(data[j-1]-data[j-2]);
		data[j]=smoothArr[j];
		smoothArr[j-1]=(data[j-2]+data[j-1]+data[j])/smoothWin;
	};
	return smoothArr;
}
