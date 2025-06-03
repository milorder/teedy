pipeline {
    agent any // 表示 Jenkins 将在任何可用的代理上运行，这里就是你的 Windows 机器

    // 如果你的系统没有全局配置 Maven，你可能需要在环境中指定 Maven 的bin目录，
    // 以确保 'mvn' 命令能被找到。例如：
    // environment {
    //     MAVEN_HOME = 'C:\\Program Files\\Apache\\apache-maven-3.9.6' // 请根据你的实际Maven安装路径修改
    //     PATH = "${MAVEN_HOME}\\bin;${env.PATH}"
    // }

    stages {
        stage('Clean') {
            steps {
                // 将 sh 'mvn clean' 替换为 bat 'mvn clean'
                bat 'mvn clean'
            }
        }
        stage('Compile') {
            steps {
                // 将 sh 'mvn compile' 替换为 bat 'mvn compile'
                bat 'mvn compile'
            }
        }
        stage('Test') {
            steps {
                // 将 sh 'mvn test -Dmaven.test.failure.ignore=true' 替换为 bat 'mvn test -Dmaven.test.failure.ignore=true'
                bat 'mvn test -Dmaven.test.failure.ignore=true'
            }
        }
        stage('PMD') {
            steps {
                // 将 sh 'mvn pmd:pmd' 替换为 bat 'mvn pmd:pmd'
                bat 'mvn pmd:pmd'
            }
        }
        stage('JaCoCo') {
            steps {
                // 将 sh 'mvn jacoco:report' 替换为 bat 'mvn jacoco:report'
                bat 'mvn jacoco:report'
            }
        }
        stage('Javadoc') {
            steps {
                // 将 sh 'mvn javadoc:javadoc' 替换为 bat 'mvn javadoc:javadoc'
                bat 'mvn javadoc:javadoc'
            }
        }
        stage('Site') {
            steps {
                // 将 sh 'mvn site' 替换为 bat 'mvn site'
                bat 'mvn site'
            }
        }
        stage('Package') {
            steps {
                // 将 sh 'mvn package -DskipTests' 替换为 bat 'mvn package -DskipTests'
                bat 'mvn package -DskipTests'
            }
        }
    }
    post {
        always {
            // 这些归档路径通常是与操作系统无关的，保持不变。
            // 确保这些文件在你的项目构建完成后确实存在于这些路径。
            archiveArtifacts artifacts: '**/target/site/**/*.*', fingerprint: true
            archiveArtifacts artifacts: '**/target/**/*.jar', fingerprint: true
            archiveArtifacts artifacts: '**/target/**/*.war', fingerprint: true
            // JUnit 报告路径也是标准的 Maven 路径。
            junit '**/target/surefire-reports/*.xml'
        }
    }
}
