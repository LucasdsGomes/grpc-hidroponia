import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const pacoteDefinicao = protoLoader.loadSync('./bancada.proto');
const grpcObject = grpc.loadPackageDefinition(pacoteDefinicao) as any;
const TaskService = grpcObject.bancada.TaskService;

const servidor = new grpc.Server();

function gerarLeitura() {
  return {
    temperatura: parseFloat((20 + Math.random() * 5).toFixed(2)),
    umidade: parseFloat((50 + Math.random() * 10).toFixed(2)),
    condutividade: parseFloat((6 + Math.random()* 5).toFixed(2))
  };
}

servidor.addService(TaskService.service, {
 ObterLeitura: (_: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
    const leitura = gerarLeitura();
    //console.log('Leitura enviada:', leitura);
    callback(null, leitura);
  }
});

servidor.bindAsync('0.0.0.0:3002', grpc.ServerCredentials.createInsecure(), () => {
  console.log('Bancada 3 rodando na porta 3002');
  
});
