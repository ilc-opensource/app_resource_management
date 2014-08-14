#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <semaphore.h>
#include <fcntl.h>
#include <sys/mman.h>
#include <iostream>
#include <cstring>
#include <errno.h>

int main() {
  sem_t *sem;
  sem = sem_open("display_touchscreen", O_CREAT, 0666, 1);
  
  int value;
  sem_getvalue(sem, &value);
  printf("sem value=%d\n", value);

  return 0;
}
