import { credentials, loadPackageDefinition } from "@grpc/grpc-js";
import { loadSync } from "@grpc/proto-loader";

const bancada = loadSync("./bancada.proto");
const bancadaProto = loadPackageDefinition(bancada) as any;

type Task = {
    id: number;
    title: string;
}

type TaskList = { tasks: Task[] }; 

const clientGRPC = new bancadaProto.TaskService(
    ['localhost:5050'],
    credentials.createInsecure()
);

clientGRPC.InsertOne({id:2,title:'Aula da Lilian'}, (err:Error | null, response:Task) => {
    
})

clientGRPC.FindAll({}, (err: Error | null, response:TaskList) => {
    console.table(response.tasks)
})

clientGRPC.EnviaDados({GerarBancada})