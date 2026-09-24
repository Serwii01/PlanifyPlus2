-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: planifyplus
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actividades`
--

DROP TABLE IF EXISTS `actividades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividades` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `aforo` int NOT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `creado_en` datetime(6) NOT NULL,
  `descripcion` tinytext NOT NULL,
  `fecha_hora_inicio` datetime(6) NOT NULL,
  `latitud` decimal(9,6) DEFAULT NULL,
  `longitud` decimal(9,6) DEFAULT NULL,
  `num_denuncias` int NOT NULL,
  `predeterminada` bit(1) NOT NULL,
  `tipo` enum('CULTURAL','DEPORTIVA','TALLER') NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `ubicacion` varchar(255) NOT NULL,
  `creado_por_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKhs0qpl3dticlmivixhemgb7s` (`creado_por_id`),
  CONSTRAINT `FKhs0qpl3dticlmivixhemgb7s` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actividades`
--

LOCK TABLES `actividades` WRITE;
/*!40000 ALTER TABLE `actividades` DISABLE KEYS */;
/*!40000 ALTER TABLE `actividades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `denuncias_actividades`
--

DROP TABLE IF EXISTS `denuncias_actividades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `denuncias_actividades` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `fecha_denuncia` datetime(6) NOT NULL,
  `actividad_id` bigint NOT NULL,
  `usuario_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKopfml16o2aulwyoni78g48ocy` (`usuario_id`,`actividad_id`),
  KEY `FKngmqt3sqe8ayciuq5df4c32bm` (`actividad_id`),
  CONSTRAINT `FK38f90d7he8t2936nhqft02834` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `FKngmqt3sqe8ayciuq5df4c32bm` FOREIGN KEY (`actividad_id`) REFERENCES `actividades` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `denuncias_actividades`
--

LOCK TABLES `denuncias_actividades` WRITE;
/*!40000 ALTER TABLE `denuncias_actividades` DISABLE KEYS */;
/*!40000 ALTER TABLE `denuncias_actividades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inscripciones`
--

DROP TABLE IF EXISTS `inscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `creada_en` datetime(6) NOT NULL,
  `actividad_id` bigint NOT NULL,
  `usuario_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKq0dje1v67l3d5ry41t8a5wj0y` (`usuario_id`,`actividad_id`),
  KEY `FKkkdce0pqh4tme1lr8edfj8qoq` (`actividad_id`),
  CONSTRAINT `FKkkdce0pqh4tme1lr8edfj8qoq` FOREIGN KEY (`actividad_id`) REFERENCES `actividades` (`id`),
  CONSTRAINT `FKqd9h5nbt6ts0deinbqcm8wqm5` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripciones`
--

LOCK TABLES `inscripciones` WRITE;
/*!40000 ALTER TABLE `inscripciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `inscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ciudad` varchar(100) DEFAULT NULL,
  `contrasena` varchar(255) NOT NULL,
  `creado_en` datetime(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `es_admin` bit(1) NOT NULL,
  `latitud` double NOT NULL,
  `longitud` double NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_kfsp0s1tflm1cwlj8idhqsad0` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Sevilla','123456','2026-03-31 12:39:35.397301','sergio@prueba.com',_binary '\0',37.3891,-5.9845,'Sergio Fernández Morales'),(2,'Praga','admin123','2026-03-31 13:36:45.000000','admin@planify.com',_binary '',50.0755,14.4378,'Admin');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuariosinscripciones`
--

DROP TABLE IF EXISTS `usuariosinscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuariosinscripciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `inscripcionID` bigint NOT NULL,
  `inscritoEn` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuariosinscripciones`
--

LOCK TABLES `usuariosinscripciones` WRITE;
/*!40000 ALTER TABLE `usuariosinscripciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuariosinscripciones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-21 17:55:22
