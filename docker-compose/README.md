```
docker-compose -f ../fabric_images/v1.0/docker-compose/docker-compose-no-cdb.yml -f marbles.yml up -d cop orderer peer-01 
docker-compose -f ../fabric_images/v1.0/docker-compose/docker-compose-no-cdb.yml -f marbles.yml up -d peer-02 mtc-01
docker-compose -f ../fabric_images/v1.0/docker-compose/docker-compose-no-cdb.yml -f marbles.yml up -d peer-03 mtc-02
``` 
