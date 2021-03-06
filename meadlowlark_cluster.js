var cluster = require('cluster');

function startWorker() {
	var worker = cluster.fork();
	console.log('CLUSTER: Worker %d started', worker.id);
}

if(cluster.isMaster){
	require('os').cpus().forEach(function(){
		startWorker();
	})

    cluster.on('disconnect', function(worker){
        console.log('CLUSTER: Worker %d disconnected from the cluster.',
            worker.id);
    });

    // when a worker dies (exits), create a worker to replace it
    cluster.on('exit', function(worker, code, signal){
        console.log('CLUSTER: Worker %d died with exit code %d (%s)',
            worker.id, code, signal);
        startWorker();
    });

} else {

    // start our app on worker; see meadowlark.js
    require('./meadowlark.js')();

}

app.use(function(req, res, next){
	var cluster = require('cluster');
	if(cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);
});