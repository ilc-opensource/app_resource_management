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
  if (argc<=1) {
    //printf("Must provide pid");
    return -1;
  }

  sem_t *sem;
  sem = sem_open(SHM_NAME_SEM, O_CREAT, 0666, 1);
  if (/*fd < 0 ||*/ sem == SEM_FAILED) {
    cout<<"shm_open or sem_open failed...";
    cout<<strerror(errno)<<endl;
    exit(-1);
  }

  sem_wait(sem);  
  FILE * fd = fopen("notification.json", "a");
  fputs(argv[1], fd);
  fputs("\n", fd);
  fclose(fd);
  fd = NULL;
  sem_post(sem);
  sem_close(sem);
  return 0;
}
