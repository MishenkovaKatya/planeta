function nk(data,fcsLen) {
	var dataY = [];
	var smoothArr = [];
	var N = data.length;
	var sumX=0, sumY=0, mul=0, powX=0;
	var a, b;

	for (var i=0;i<data.length;i++)
	{
		dataY[i]=i;
	}
	var i;
	for (i = 0; i < N; i++) {
	  sumX += data[i];
	  sumY += dataY[i];
	  mul += data[i]*dataY[i];
	  powX += data[i]*data[i];
	};

	a = (N*mul-sumX*sumY)/(N*powX-sumX*sumX);
	b = (sumY-a*sumX)/N;

	var j;
	for (j = 0; j < (N+fcsLen); j++) {
	    smoothArr[j]=a*dataY[j]+b;
	};

	var k;
	for (k = N; k < (N+fcsLen); k++) {
	    dataY[k]=dataY[k-1]+(dataY[k-1]-dataY[k-2])
	    smoothArr[k]=a*dataY[k]+b;
	};
	return smoothArr;
}

