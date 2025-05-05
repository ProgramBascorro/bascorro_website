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

 #ifndef DYNAMICEDT3D_DYNAMICEDTOCTOMAP_H_
 #define DYNAMICEDT3D_DYNAMICEDTOCTOMAP_H_
 
 #include "dynamicEDT3D.h"
 #include <octomap/OcTree.h>
 
 /// A dynamically updatable Euclidean distance transform in 3D based on an octomap as input data
 class DynamicEDTOctomap {
 public:
   /**
    * Constructor for the DynamicEDTOctomap.
    *
    * @param _maxdist Maximum distance to be computed in meters. Voxels further away will have maxDist as distance value.
    * @param _treatUnknownAsOccupied When true, unknown cells are included as occupied cells when computing distance values.
    * @param _maxDepth Octree depth to use in the distance transform.
    */
   DynamicEDTOctomap(float _maxdist, bool _treatUnknownAsOccupied, octomap::OcTree* _octree, unsigned int _maxDepth = 0);
   virtual ~DynamicEDTOctomap();
 
   /**
    * Update the internal octree to a new one (timestamp for update is 0 automatically).
    * Resets the distance values. You need to call computeDistanceMap() after this.
    */
   void setOcTree(octomap::OcTree* _octree);
 
   /**
    * Update distance map from the octree. The octree needs to be initialized beforehand.
    */
   void update(bool updateRealDist = true);
 
   /**
    * Prune the internal octree representation to save memory. Only distances up
    * to a maximum of pruneDist are guaranteed to be correct after calling this.
    * Similar to the maxDist parameter in the constructor.
    */
   void prune(float pruneDist);
 
   /**
    * Returns the distance (in meter) to the nearest occupied cell for a given coordinate.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    *
    * @param p 3D coordinate of the query point
    * @return Euclidean distance to the closest occupied cell
    */
   float getDistance(const octomap::point3d& p) const;
 
   /**
    * Returns the distance (in meter) to the nearest occupied cell for a given octomap key.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    *
    * @param key OcTreeKey of the query point
    * @return Euclidean distance to the closest occupied cell
    */
   float getDistance(const octomap::OcTreeKey& key) const;
 
   /**
    * Returns the squared distance (in meter^2) to the nearest occupied cell for a given coordinate.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    *
    * @param p 3D coordinate of the query point
    * @return Squared Euclidean distance to the closest occupied cell
    */
   float getSqrDistance(const octomap::point3d& p) const;
 
   /**
    * Returns the squared distance (in meter^2) to the nearest occupied cell for a given octomap key.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    *
    * @param key OcTreeKey of the query point
    * @return Squared Euclidean distance to the closest occupied cell
    */
   float getSqrDistance(const octomap::OcTreeKey& key) const;
 
   /**
    * Returns the distance (in meter) to the nearest occupied cell for a given coordinate.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    * Same as getDistance() but with additional parameter to return the closest occupied cell.
    *
    * @param p 3D coordinate of the query point
    * @param closestObstacle the closest occupied cell
    * @return Euclidean distance to the closest occupied cell
    */
   float getDistance(const octomap::point3d& p, octomap::point3d& closestObstacle) const;
 
   /**
    * Returns the distance (in meter) to the nearest occupied cell for a given octomap key.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    * Same as getDistance() but with additional parameter to return the closest occupied cell.
    *
    * @param key OcTreeKey of the query point
    * @param closestObstacle the closest occupied cell
    * @return Euclidean distance to the closest occupied cell
    */
   float getDistance(const octomap::OcTreeKey& key, octomap::point3d& closestObstacle) const;
 
   /**
    * Returns the squared distance (in meter^2) to the nearest occupied cell for a given coordinate.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    * Same as getSqrDistance() but with additional parameter to return the closest occupied cell.
    *
    * @param p 3D coordinate of the query point
    * @param closestObstacle the closest occupied cell
    * @return Squared Euclidean distance to the closest occupied cell
    */
   float getSqrDistance(const octomap::point3d& p, octomap::point3d& closestObstacle) const;
 
   /**
    * Returns the squared distance (in meter^2) to the nearest occupied cell for a given octomap key.
    * Checks for the closest occupied cell within sqrt(3) * maxDist.
    * Same as getSqrDistance() but with additional parameter to return the closest occupied cell.
    *
    * @param key OcTreeKey of the query point
    * @param closestObstacle the closest occupied cell
    * @return Squared Euclidean distance to the closest occupied cell
    */
   float getSqrDistance(const octomap::OcTreeKey& key, octomap::point3d& closestObstacle) const;
 
 protected:
   void initializeOcTree(octomap::OcTree* _octree);
   void initializeFromOctoMap();
   void updateMaxDepth();
 
   DynamicEDT3D * distanceMap;
 
   bool treatUnknownAsOccupied;
   float maxDist;
 
   int treeDepth;
   int treeMaxDepth;
 
   octomap::OcTree* octree;
   unsigned int mapSize;
 
   double res;
   octomap::OcTreeKey tmpKey;
 };
 
 #endif // DYNAMICEDT3D_DYNAMICEDTOCTOMAP_H_