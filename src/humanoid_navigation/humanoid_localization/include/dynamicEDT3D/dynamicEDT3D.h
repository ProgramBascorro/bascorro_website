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

// Simple class for dynamic 3D distance transforms

#ifndef _DYNAMICEDT3D_H_
#define _DYNAMICEDT3D_H_

#include <limits.h>
#include <queue>
#include <map>  // Add this missing include

//! A DynamicEDT3D object computes and updates a 3D distance transform of an occupancy grid.
class DynamicEDT3D {

public:

  //! Constructor for the DynamicEDT3D.
  DynamicEDT3D(int _maxdist_squared);
  //! Constructor for the DynamicEDT3D.
  DynamicEDT3D(int _maxdist_squared, int _xsize, int _ysize, int _zsize, bool initGridMap=true);
  virtual ~DynamicEDT3D();

  //! Sets the occupancy status of a cell.
  void occupyCell(int x, int y, int z);
  //! Removes the occupancy status of a cell.
  void clearCell(int x, int y, int z);

  //! Update distance values after changed (un)occupied cells.
  virtual void update(bool updateRealDist=true);
  //! Prune distance values to save memory.
  void prune(int maxdist);

  //! Returns true if the cell is occupied.
  bool isOccupied(int x, int y, int z) const;
  //! Returns the squared distance value of the cell.
  int getSqrDistance(int x, int y, int z) const;
  //! Returns the squared distance value of the cell.
  int getSqrDistance(int *sqdist, int x, int y, int z) const;
  //! Returns the closest occupied cell.
  void getClosestOccupied(int &x, int &y, int &z, int &sqdist) const;
  //! Returns the closest occupied cell.
  void getClosestOccupied(int &x, int &y, int &z) const;

  //! Returns the x size of the grid.
  int getSizeX() const {return sizeX;}
  //! Returns the y size of the grid.
  int getSizeY() const {return sizeY;}
  //! Returns the z size of the grid.
  int getSizeZ() const {return sizeZ;}

protected:
  struct dataCell {
    int obstX;
    int obstY;
    int obstZ;
    int sqdist;
    char queueing;
    bool needsRaise;
  };

  typedef enum {NOT_IN_QUEUE, OPEN, CLOSED} T_QUEUEING;
  typedef enum {DIST_BIAS=340, OBSTACLE_BIAS=650} T_BIAS;

  inline void initializeCell(int x, int y, int z);
  void raiseCell(int x, int y, int z, dataCell &c, bool updateRealDist);
  bool checkVoronoi(int x, int y, int z, dataCell &c);
  void commitAndColorize(bool updateRealDist=true);

  inline void putOnGridNS(int x, int y, int z){
    if (x>=0 && x<sizeX && y>=0 && y<sizeY && z>=0 && z<sizeZ){
      dataCell &c = gridMap[z][y][x];
      if (!c.needsRaise) {
        c.needsRaise = true;
        open.push(OBSTACLE_BIAS + DIST_BIAS * c.sqdist + (c.obstX-x)*(c.obstX-x) + (c.obstY-y)*(c.obstY-y) + (c.obstZ-z)*(c.obstZ-z));
        c.queueing = OPEN;
      }
    }
  }

  inline void putOnGrid(int x, int y, int z){
    dataCell &c = gridMap[z][y][x];
    if (c.queueing != CLOSED) {
      if (c.queueing == NOT_IN_QUEUE) {
        open.push(OBSTACLE_BIAS + DIST_BIAS * c.sqdist + (c.obstX-x)*(c.obstX-x) + (c.obstY-y)*(c.obstY-y) + (c.obstZ-z)*(c.obstZ-z));
        c.queueing = OPEN;
        if (modifiedCells) modifiedCells->insert(std::make_pair(x, std::make_pair(y, z)));
      } else {
        c.queueing = OPEN;
      }
    }
  }

  std::priority_queue<int> open;

  int sizeX;
  int sizeY;
  int sizeZ;
  int maxDist_squared;

  dataCell*** gridMap;

  std::map<int, std::pair<int, int> > *modifiedCells;
  bool allocatedCells;

};

#endif