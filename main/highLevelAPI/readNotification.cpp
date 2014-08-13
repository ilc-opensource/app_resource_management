#include <iostream>  
#include <cstring>  
#include <errno.h>  
#include <stdlib.h>  
#include <unistd.h>  
#include <fcntl.h>  
#include <semaphore.h>  
#include <sys/mman.h>
#include <stdio.h>
using namespace std;

#define SHM_NAME "/memmap_notification"
#define SHM_NAME_SEM "/memmap_sem_notification"

int main(int argc, char** argv) {
  sem_t *sem;
  sem = sem_open(SHM_NAME_SEM, O_CREAT, 0666, 1);
  if (/*fd < 0 ||*/ sem == SEM_FAILED) {
    cout<<"shm_open or sem_open failed...";
    cout<<strerror(errno)<<endl;
    exit(-1);
  }

  sem_wait(sem);  
  char myString[100];
  FILE * fd = fopen("notification.json", "r+");
  if (fd == NULL) perror("Error opening file");
  else {
    while (fgets(myString, 100, fd) != NULL) {
      puts(myString);
    }
    fclose(fd);
    fd = NULL;
  }
  fd = fopen("notification.json", "w");
  if (fd == NULL) perror("Error opening file");
  fclose(fd);
  fd = NULL;
  sem_post(sem);
  sem_close(sem);
  sem_unlink(SHM_NAME_SEM);
  return 0;
}
