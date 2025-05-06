import {
    loadPackageDefinition,
    Server,
    ServerCredentials,
    sendUnaryData,
    ServerUnaryCall
  } from '@grpc/grpc-js';
  import { loadSync } from '@grpc/proto-loader';
  
  interface Empty {}
  interface Dados {
    temperatura: number;
    umidade: number;
    condutividade: number;
  }
  
  function getRandomArbitrary() {
    return Math.floor(Math.random() * (100 - 10) + 10);
  }
  
  const sensor: Dados = {
    temperatura: getRandomArbitrary(),
    umidade: getRandomArbitrary(),
    condutividade: getRandomArbitrary(),
  };
  
  const pacote = loadSync('./bancada.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  const grpcObject = loadPackageDefinition(pacote) as any;
  
  const grpcServer = new Server();
  
  grpcServer.addService(grpcObject.BancadaService.service, {
    SolicitaDados: (_: ServerUnaryCall<Empty, Dados>, callback: sendUnaryData<Dados>) => {
      console.log("Cliente solicitou os dados da bancada.");
      callback(null, sensor);
    }
  });
  
  const porta = 3000;
  grpcServer.bindAsync(`0.0.0.0:${porta}`, ServerCredentials.createInsecure(), () => {
    console.log(`Servidor gRPC da bancada iniciado na porta ${porta}`);
  });
  