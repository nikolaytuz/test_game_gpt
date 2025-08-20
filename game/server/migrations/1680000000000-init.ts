import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1680000000000 implements MigrationInterface {
  name = 'Init1680000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`users\` (
  \`id\` char(36) NOT NULL PRIMARY KEY,
  \`nickname\` varchar(255) UNIQUE NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await queryRunner.query(`CREATE TABLE \`matches\` (
  \`id\` char(36) NOT NULL PRIMARY KEY,
  \`status\` enum('WAITING','RUNNING','FINISHED') NOT NULL DEFAULT 'WAITING',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`mapBlueprintId\` int NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await queryRunner.query(`CREATE TABLE \`match_participants\` (
  \`id\` char(36) NOT NULL PRIMARY KEY,
  \`team\` enum('A','B') NOT NULL,
  \`joined_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`matchId\` char(36) NULL,
  \`userId\` char(36) NULL,
  INDEX (\`matchId\`), INDEX (\`userId\`),
  CONSTRAINT \`fk_match\` FOREIGN KEY (\`matchId\`) REFERENCES \`matches\`(\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await queryRunner.query(`CREATE TABLE \`map_blueprints\` (
  \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  \`name\` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await queryRunner.query(`CREATE TABLE \`map_node_blueprints\` (
  \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  \`kind\` enum('BASE','RESOURCE','DEFENSE','ARMY','SPECIAL') NOT NULL,
  \`x\` int NOT NULL,
  \`y\` int NOT NULL,
  \`blueprintId\` int NULL, INDEX (\`blueprintId\`),
  CONSTRAINT \`fk_node_bp\` FOREIGN KEY (\`blueprintId\`) REFERENCES \`map_blueprints\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await queryRunner.query(`CREATE TABLE \`map_edge_blueprints\` (
  \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  \`distance\` int NOT NULL,
  \`blueprintId\` int NULL,
  \`fromId\` int NULL,
  \`toId\` int NULL, INDEX (\`blueprintId\`), INDEX (\`fromId\`), INDEX (\`toId\`),
  CONSTRAINT \`fk_edge_bp\` FOREIGN KEY (\`blueprintId\`) REFERENCES \`map_blueprints\`(\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_edge_from\` FOREIGN KEY (\`fromId\`) REFERENCES \`map_node_blueprints\`(\`id\`) ON DELETE CASCADE,
  CONSTRAINT \`fk_edge_to\` FOREIGN KEY (\`toId\`) REFERENCES \`map_node_blueprints\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await queryRunner.query(`INSERT INTO map_blueprints (id,name) VALUES (1,'Starter 5 Nodes')`);
    await queryRunner.query(`INSERT INTO map_node_blueprints (id,blueprintId,kind,x,y) VALUES
      (1,1,'BASE',100,300),
      (2,1,'RESOURCE',300,250),
      (3,1,'ARMY',450,320),
      (4,1,'DEFENSE',600,350),
      (5,1,'BASE',700,300)`);
    await queryRunner.query(`INSERT INTO map_edge_blueprints (blueprintId,fromId,toId,distance) VALUES
      (1,1,2,206),
      (1,2,3,165),
      (1,3,4,153),
      (1,4,5,112),
      (1,2,4,316)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `map_edge_blueprints`');
    await queryRunner.query('DROP TABLE `map_node_blueprints`');
    await queryRunner.query('DROP TABLE `map_blueprints`');
    await queryRunner.query('DROP TABLE `match_participants`');
    await queryRunner.query('DROP TABLE `matches`');
    await queryRunner.query('DROP TABLE `users`');
  }
}

