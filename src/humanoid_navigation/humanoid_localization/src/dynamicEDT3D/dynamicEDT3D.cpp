/**
* dynamicEDT3D:
* A library for incrementally updatable Euclidean distance transforms in 3D.
* @author C. Sprunk, B. Lau, W. Burgard
* @see http://octomap.github.com/
* License: BSD
*/

/*
 * Copyright (c) 2011-2012, C. Sprunk, B. Lau, W. Burgard, University of Freiburg
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the University of Freiburg nor the names of its
 *       contributors may be used to endorse or promote products derived from
 *       this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

#include <dynamicEDT3D/dynamicEDT3D.h>
#include <algorithm>
#include <stdlib.h>
#include <stdio.h>

// This is a simplified implementation with just the bare minimum to work with the EndpointModel
DynamicEDT3D::DynamicEDT3D(int _maxdist_squared) 
  : maxDist_squared(_maxdist_squared), sizeX(0), sizeY(0), sizeZ(0), gridMap(NULL), modifiedCells(NULL), allocatedCells(false)
{}

DynamicEDT3D::DynamicEDT3D(int _maxdist_squared, int _xsize, int _ysize, int _zsize, bool initGridMap)
  : maxDist_squared(_maxdist_squared), sizeX(_xsize), sizeY(_ysize), sizeZ(_zsize), modifiedCells(NULL), allocatedCells(false)
{
  // Allocate gridMap
  gridMap = new dataCell**[sizeZ];
  for (int z=0; z<sizeZ; z++) {
    gridMap[z] = new dataCell*[sizeY];
    for (int y=0; y<sizeY; y++) {
      gridMap[z][y] = new dataCell[sizeX];
    }
  }
  
  // Initialize with default values
  if (initGridMap) {
    for (int z=0; z<sizeZ; z++) {
      for (int y=0; y<sizeY; y++) {
        for (int x=0; x<sizeX; x++) {
          dataCell& c = gridMap[z][y][x];
          c.obstX = x;
          c.obstY = y;
          c.obstZ = z;
          c.sqdist = maxDist_squared;
          c.queueing = NOT_IN_QUEUE;
          c.needsRaise = false;
        }
      }
    }
  }
}

DynamicEDT3D::~DynamicEDT3D() {
  if (gridMap) {
    for (int z=0; z<sizeZ; z++) {
      for (int y=0; y<sizeY; y++) {
        delete[] gridMap[z][y];
      }
      delete[] gridMap[z];
    }
    delete[] gridMap;
  }
  if (allocatedCells && modifiedCells) delete modifiedCells;
}

void DynamicEDT3D::initializeCell(int x, int y, int z) {
  dataCell& c = gridMap[z][y][x];
  c.obstX = x;
  c.obstY = y;
  c.obstZ = z;
  c.sqdist = 0;
  c.queueing = NOT_IN_QUEUE;
  c.needsRaise = false;
}

void DynamicEDT3D::occupyCell(int x, int y, int z) {
  if (x>=0 && x<sizeX && y>=0 && y<sizeY && z>=0 && z<sizeZ) {
    initializeCell(x, y, z);
  }
}

void DynamicEDT3D::clearCell(int x, int y, int z) {
  if (x>=0 && x<sizeX && y>=0 && y<sizeY && z>=0 && z<sizeZ) {
    dataCell& c = gridMap[z][y][x];
    if (c.sqdist == 0) {
      c.obstX = x;
      c.obstY = y;
      c.obstZ = z;
      c.sqdist = maxDist_squared;
      c.needsRaise = true;
    }
  }
}

bool DynamicEDT3D::isOccupied(int x, int y, int z) const {
  if (x>=0 && x<sizeX && y>=0 && y<sizeY && z>=0 && z<sizeZ) {
    return (gridMap[z][y][x].sqdist == 0);
  } else {
    return false;
  }
}

int DynamicEDT3D::getSqrDistance(int x, int y, int z) const {
  if (x<0 || x>=sizeX || y<0 || y>=sizeY || z<0 || z>=sizeZ) return maxDist_squared;
  return gridMap[z][y][x].sqdist;
}

int DynamicEDT3D::getSqrDistance(int* sqdist, int x, int y, int z) const {
  if (x<0 || x>=sizeX || y<0 || y>=sizeY || z<0 || z>=sizeZ) {
    *sqdist = maxDist_squared;
    return maxDist_squared;
  }
  *sqdist = gridMap[z][y][x].sqdist;
  return gridMap[z][y][x].sqdist;
}

void DynamicEDT3D::getClosestOccupied(int& x, int& y, int& z, int& sqdist) const {
  if (x<0 || x>=sizeX || y<0 || y>=sizeY || z<0 || z>=sizeZ) {
    x = y = z = -1;
    sqdist = maxDist_squared;
    return;
  }
  const dataCell& c = gridMap[z][y][x];
  x = c.obstX;
  y = c.obstY;
  z = c.obstZ;
  sqdist = c.sqdist;
}

void DynamicEDT3D::getClosestOccupied(int &x, int &y, int &z) const {
  int sqdist;
  getClosestOccupied(x, y, z, sqdist);
}

void DynamicEDT3D::raiseCell(int x, int y, int z, dataCell& c, bool updateRealDist) {
    // This is a simplified implementation
    // For full functionality, see the original source
    if (c.needsRaise) {
      c.needsRaise = false;
      c.sqdist = maxDist_squared;
    }
}

bool DynamicEDT3D::checkVoronoi(int x, int y, int z, dataCell& c) {
    // This is a simplified implementation
    // For full functionality, see the original source
    return false;
}

void DynamicEDT3D::commitAndColorize(bool updateRealDist) {
    // This is a simplified implementation
    // For full functionality, see the original source
    while (!open.empty()) {
        open.pop();
    }
}

void DynamicEDT3D::update(bool updateRealDist) {
    // This is a simplified implementation
    // For full functionality, see the original source
    commitAndColorize(updateRealDist);
}

void DynamicEDT3D::prune(int maxdist) {
    // This is a simplified implementation
    // For full functionality, see the original source
}
