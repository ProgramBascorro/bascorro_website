/**
* dynamicEDTOctomap:
* A dynamically updatable Euclidean distance transform for octomap maps.
* @author Armin Hornung, University of Freiburg, Copyright (C) 2012-2013.
* @see http://octomap.github.com/
* License: BSD
*/

/*
 * Copyright (c) 2012-2013, Armin Hornung, University of Freiburg
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

#include <dynamicEDT3D/dynamicEDTOctomap.h>

DynamicEDTOctomap::DynamicEDTOctomap(float _maxdist, bool _treatUnknownAsOccupied, octomap::OcTree* _octree, unsigned int _maxDepth)
: maxDist(_maxdist), treatUnknownAsOccupied(_treatUnknownAsOccupied), octree(_octree), treeMaxDepth(_maxDepth)
{
  distanceMap = NULL;
  treeDepth = octree->getTreeDepth();

  if (treeMaxDepth > 0 && treeMaxDepth <= treeDepth)
    treeDepth = treeMaxDepth;

  // initialize distance map
  initializeFromOctoMap();
}

DynamicEDTOctomap::~DynamicEDTOctomap() {
  if (distanceMap)
    delete distanceMap;
}

void DynamicEDTOctomap::initializeFromOctoMap() {
  updateMaxDepth();

  // create distance map
  int mapSize = 1 << treeDepth;
  int mapSizeX, mapSizeY, mapSizeZ;
  mapSizeX = mapSizeY = mapSizeZ = mapSize;

  if (distanceMap) delete distanceMap;

  int maxDistInt = (int)ceil(maxDist / float(octree->getResolution()));
  distanceMap = new DynamicEDT3D(maxDistInt, mapSizeX, mapSizeY, mapSizeZ);
  distanceMap->update();

  // initialize distance map
  initializeOcTree(octree);
  distanceMap->update();
}

void DynamicEDTOctomap::update(bool updateRealDist) {
  distanceMap->update(updateRealDist);
}

void DynamicEDTOctomap::prune(float pruneDist) {
  distanceMap->prune((int)ceil(pruneDist / float(octree->getResolution())));
}

void DynamicEDTOctomap::updateMaxDepth() {
  treeDepth = octree->getTreeDepth();

  if (treeMaxDepth > 0 && treeMaxDepth <= treeDepth)
    treeDepth = treeMaxDepth;
}

void DynamicEDTOctomap::setOcTree(octomap::OcTree* _octree) {
  octree = _octree;
  initializeFromOctoMap();
}

void DynamicEDTOctomap::initializeOcTree(octomap::OcTree* _octree) {
  if (!_octree) return;

  octree = _octree;
  res = octree->getResolution();

  int mapSize = 1 << treeDepth;
  octomap::OcTreeKey key;

  for(octomap::OcTree::leaf_bbx_iterator it = octree->begin_leafs_bbx(octree->getBBXMin(),octree->getBBXMax()),
    end=octree->end_leafs_bbx(); it!= end; ++it) {
    
    if (it.getDepth() != octree->getTreeDepth()) continue;

    bool occupied = false;
    
    if (octree->isNodeOccupied(*it)) 
      occupied = true;
      else if (treatUnknownAsOccupied && octree->search(it.getKey()) == NULL)
      occupied = true;

    if (occupied) {
      key = it.getKey();
      int x = key[0] & mapSize-1;
      int y = key[1] & mapSize-1;
      int z = key[2] & mapSize-1;

      distanceMap->occupyCell(x, y, z);
    }
  }
}

float DynamicEDTOctomap::getDistance(const octomap::point3d& p) const {
  octomap::OcTreeKey key;
  if (!octree->coordToKeyChecked(p, key)) {
    return maxDist;
  }

  return getDistance(key);
}

float DynamicEDTOctomap::getDistance(const octomap::OcTreeKey& key) const {
  int x = key[0] & ((1 << treeDepth) - 1);
  int y = key[1] & ((1 << treeDepth) - 1);
  int z = key[2] & ((1 << treeDepth) - 1);

  int sqrDist = distanceMap->getSqrDistance(x, y, z);
  return sqrt(float(sqrDist)) * float(octree->getResolution());
}

float DynamicEDTOctomap::getDistance(const octomap::point3d& p, octomap::point3d& closestObst) const {
  octomap::OcTreeKey key;
  if (!octree->coordToKeyChecked(p, key)) {
    return maxDist;
  }

  return getDistance(key, closestObst);
}

float DynamicEDTOctomap::getDistance(const octomap::OcTreeKey& key, octomap::point3d& closestObst) const {
  int x = key[0] & ((1 << treeDepth) - 1);
  int y = key[1] & ((1 << treeDepth) - 1);
  int z = key[2] & ((1 << treeDepth) - 1);

  int closestX = x; 
  int closestY = y;
  int closestZ = z;
  int sqrDist;

  // Use the correct method signature with 4 arguments instead of 6
  distanceMap->getClosestOccupied(closestX, closestY, closestZ, sqrDist);

  octomap::OcTreeKey closest_key;
  closest_key[0] = closestX;
  closest_key[1] = closestY;
  closest_key[2] = closestZ;
  
  // Use the correct keyToCoord version with only one argument
  closestObst = octree->keyToCoord(closest_key);

  return sqrt(float(sqrDist)) * float(octree->getResolution());
}

float DynamicEDTOctomap::getSqrDistance(const octomap::point3d& p) const {
  octomap::OcTreeKey key;
  if (!octree->coordToKeyChecked(p, key)) {
    return maxDist * maxDist;
  }

  return getSqrDistance(key);
}

float DynamicEDTOctomap::getSqrDistance(const octomap::OcTreeKey& key) const {
  int x = key[0] & ((1 << treeDepth) - 1);
  int y = key[1] & ((1 << treeDepth) - 1);
  int z = key[2] & ((1 << treeDepth) - 1);

  return float(distanceMap->getSqrDistance(x, y, z)) * float(octree->getResolution()) * float(octree->getResolution());
}

float DynamicEDTOctomap::getSqrDistance(const octomap::point3d& p, octomap::point3d& closestObst) const {
  octomap::OcTreeKey key;
  if (!octree->coordToKeyChecked(p, key)) {
    return maxDist * maxDist;
  }

  return getSqrDistance(key, closestObst);
}

float DynamicEDTOctomap::getSqrDistance(const octomap::OcTreeKey& key, octomap::point3d& closestObst) const {
  int x = key[0] & ((1 << treeDepth) - 1);
  int y = key[1] & ((1 << treeDepth) - 1);
  int z = key[2] & ((1 << treeDepth) - 1);

  int closestX = x;
  int closestY = y;
  int closestZ = z;
  int sqrDist;
  
  // Use the correct method signature with 4 arguments instead of 6
  distanceMap->getClosestOccupied(closestX, closestY, closestZ, sqrDist);

  octomap::OcTreeKey closest_key;
  closest_key[0] = closestX;
  closest_key[1] = closestY;
  closest_key[2] = closestZ;
  
  // Use the correct keyToCoord version with only one argument
  closestObst = octree->keyToCoord(closest_key);

  return float(sqrDist) * float(octree->getResolution()) * float(octree->getResolution());
}
