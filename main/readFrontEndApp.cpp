#include <iostream>
#include <cstring>
#include <errno.h>

#include <unistd.h>
#include <fcntl.h>
#include <semaphore.h>
#include <sys/mman.h>
#include <stdio.h>

#define SHM_NAME "/memmap"
#define SHM_NAME_SEM "/memmap_sem"

//int isFrontEndApp() {
int main() {
  int fd;
  sem_t *sem;
  int retv;

  fd = shm_open(SHM_NAME, O_RDWR | O_CREAT, 0666);
  //sem = sem_open(SHM_NAME_SEM, O_CREAT, 0666, 1);

  if (fd < 0 /*|| sem == SEM_FAILED*/) {
    //cout<<"shm_open or sem_open failed...";
    //cout<<strerror(errno)<<endl;
    //exit(-1);
    return -1;
  }
  ftruncate(fd, sizeof(pid_t));
  pid_t* memPtr = (pid_t *)mmap(NULL, sizeof(pid_t), PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  close(fd);

  //sem_wait(sem);
  if (*memPtr == getpid())
    retv = true;
  else
    retv = false;
  //sem_post(sem);
  printf("FrontEndApp=%d\n", *memPtr);

  return retv;
}

